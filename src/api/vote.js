import moment from 'moment-timezone';
import { promisify } from 'util';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import Group from './group';

/**
 * Gets all the votes the user can see
 * @param  {User} user
 * @return {Vote[]} The user's votes sorted start date descending
 */
export async function getUserVotes (user) {
	const time = moment().unix();
	const canSeeAll = await user.hasPermission('votes.manage');
	const groups = [...(await user.getGroups()).values()];

	const groupsParams = '?,'.repeat(groups.length).slice(0, -1);
	return await Promise.all(CR.db.votes.prepare(`
		select
			*,
			exists(
				select 1 from votes_groups where vote_id = id and group_id in (${groupsParams})
			) as can_vote,
			exists(
				select 1 from votes_ballots where vote_id = id and user_id = :userId
			) as has_voted
		from votes
		where
			:canSeeAll or can_vote
		order by timeFrom desc
	`).all(
		{
			canSeeAll: +canSeeAll,
			userId: user.id
		},
		...groups.map(x => x.group.id)
	).map(async vote => {
		if (vote.timeTo < time) {
			vote.state = 'Fermita';
		} else {
			vote.state = 'Malfermita ';
			if (vote.can_vote) {
				if (vote.has_voted) {
					vote.state += ' (voĉdonis)';
				} else {
					vote.state += ' (ne voĉdonis)';
				}
			}
		}
		vote.opts = (await csvParse(vote.opts))[0];

		const groupIds = CR.db.votes.prepare('SELECT group_id from votes_groups where vote_id = ?').all(vote.id);
		const groups = await Promise.all(groupIds.map(x => Group.getGroupById(x.group_id)));
		vote.groups = groups.map(x => x.nameBase);

		const usersAllowedToVoteWithDupesDeep = await Promise.all(groups.map(x => x.getAllUsers(true)));
		const usersAllowedToVoteWithDupes = [].concat(...usersAllowedToVoteWithDupesDeep);
		const usersAllowedToVote = [];
		const usersAllowedToVoteIds = [];
		for (let user of usersAllowedToVoteWithDupes) {
			if (usersAllowedToVoteIds.includes(user.id)) { continue; }
			usersAllowedToVote.push(user);
			usersAllowedToVoteIds.push(user.id);
		}

		vote.numAllowedToVote = usersAllowedToVote.length;

		const userIdsVoted = (await CR.db.votes.prepare('SELECT user_id FROM votes_ballots WHERE vote_id = ?').all(vote.id)).map(x => x.user_id);
		vote.numBallotsCast = userIdsVoted.length;
		vote.usersNotVoted = usersAllowedToVote.filter(u => !userIdsVoted.includes(u.id));

		vote.hasEnded = vote.timeTo < moment().unix();

		return vote;
	}));
}
