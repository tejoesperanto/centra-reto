import moment from 'moment-timezone';
import { RankedPairs, STV } from 'vocho-lib';
import { promisify } from 'util';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);
import url from 'url';

import Group from './group';
import * as CRMail from '../mail';

const range = (start, end) => Array.from({length: (end - start + 1)}, (v, k) => k + start);
const symbols = String.fromCharCode(
	...range(0x30, 0x39), // 0-9
	...range(0x41, 0x5a), // A-Z
	...range(0x61, 0x7a), // a-z
	...range(0xc0, 0xd6), // latin-1 uppercase 1
	...range(0xd8, 0xf6), // latin-1 uppercase 2, latin-1 lowercase 1
	...range(0xf8, 0xff), // latin-1 lowercase 2
);

export const tieBreakerGroupId = 7;

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
		vote.usersVoted = usersAllowedToVote.filter(u => userIdsVoted.includes(u.id));

		vote.hasEnded = vote.timeTo < moment().unix();

		// Create results for votes that have ended but still don't have results
		if (vote.hasEnded) {
			let results = CR.db.votes.prepare('SELECT results from votes_results where id = ?').get(vote.id);
			if (results) {
				results = JSON.parse(results.results);
			} else {
				results = {
					ballots: CR.db.votes.prepare('SELECT user_id, ballot from votes_ballots where vote_id = ?').all(vote.id),
					numAllowedToVote: vote.numAllowedToVote
				};

				if (vote.type === 'jns') {
					results.reachedQuorum = vote.numBallotsCast / vote.numAllowedToVote >= vote.quorum;
					results.tally = {
						'j': 0,
						'n': 0,
						's': 0
					};
					for (const ballot of results.ballots) {
						results.tally[ballot.ballot]++;
					}
					results.isSindeteno = results.tally.s / vote.numBallotsCast >= .5;
					if (!vote.majority) {
						results.hasMajority = results.tally.j > results.tally.n;
					} else {
						if (vote.majorityMustBeGreater) {
							results.hasMajority = results.tally.j >  results.majority * vote.numBallotsCast;
						} else {
							results.hasMajority = results.tally.j >= results.majority * vote.numBallotsCast;
						}
					}
					results.isAccepted = !results.isSindeteno && results.hasMajority;
				} else if (vote.type === 'pr') {
					results.ballotsStr = results.ballots.map(ballotObj => {
						const ballotArr = ballotObj.ballot.split('\n').map(x => x.split(','));
						return ballotArr
							.map(x => x.map(y => symbols[y]).join('='))
							.join('>');
					});
					let tieBreakerBallot = undefined;
					if (vote.tieBreakerBallot) {
						tieBreakerBallot = vote.tieBreakerBallot
							.split('\n')
							.map(x => x.split(','))
							.map(x => x.map(y => symbols[y]).join('='))
							.join('>');
					}
					try {
						results.vochoResults = RankedPairs(
							symbols.substring(0, vote.opts.length), // candidates
							results.ballotsStr, // ballots
							[], // ignoredCandidates
							tieBreakerBallot // tieBreaker, if one exists
						);
						results.vochoAliases = symbols.substring(0, vote.opts.length).split('');
						results.vochoAliasesInverse = {};
						for (let alias of results.vochoAliases) {
							results.vochoAliasesInverse[alias] = vote.opts[symbols.indexOf(alias)];
						}
					} catch (e) {
						if (e.type === 'TIE_BREAKER_NEEDED') {
							results.result = 'TIE_BREAKER_NEEDED';
						} else if (e.type === 'BLANK_BALLOTS') {
							results.isSindeteno = true;
							results.vochoResults = {
								numBallots: e.numBallots,
								blankBallots: e.blankBallots
							};
						} else {
							throw e;
						}
					}
					results.isSindeteno = false;
				} else if (vote.type === 'utv') {
					results.ballotsStr = results.ballots.map(ballotObj => {
						return ballotObj.ballot.split('\n').map(x => symbols[x]).join('');
					});
					let tieBreakerBallot = undefined;
					if (vote.tieBreakerBallot) {
						tieBreakerBallot = vote.tieBreakerBallot.split('\n').map(x => symbols[x]).join('');
					}
					try {
						results.vochoResults = STV(
							vote.numWinners, // places
							symbols.substring(0, vote.opts.length), // candidates
							results.ballotsStr, // ballots
							[], // ignoredCandidates
							tieBreakerBallot // tieBreaker, if one exists
						);
						results.vochoAliases = symbols.substring(0, vote.opts.length).split('');
						results.vochoAliasesInverse = {};
						for (let alias of results.vochoAliases) {
							results.vochoAliasesInverse[alias] = vote.opts[symbols.indexOf(alias)];
						}
					} catch (e) {
						if (e.type === 'TIE_BREAKER_NEEDED') {
							results.result = 'TIE_BREAKER_NEEDED';
						} else if (e.type === 'BLANK_BALLOTS') {
							results.isSindeteno = true;
							results.vochoResults = {
								numBallots: e.numBallots,
								blankBallots: e.blankBallots
							};
						} else {
							throw e;
						}
					}
					results.isSindeteno = false;
				}

				// Insert the results
				CR.db.votes.prepare('INSERT into votes_results (id, results) values (?, ?)').run(vote.id, JSON.stringify(results));

				// Inform the relevant people on the occasion a tie breaker is needed
				if (results.result === 'TIE_BREAKER_NEEDED') {
					const tieBreakerGroup = await Group.getGroupById(tieBreakerGroupId);
					const tieBreakerUsers = await tieBreakerGroup.getAllUsers(true);
					const promises = tieBreakerUsers.map(user => {
						return CRMail.renderSendMail('voting_tie_breaker', {
							name: user.getBriefName(),
							vote: vote,
							url: url.resolve(CR.conf.addressPrefix, 'vochdonado/retaj/' + vote.id)
						}, {
							to: user.email
						});
					});
					await Promise.all(promises);
				}

			}
			vote.results = JSON.parse(JSON.stringify(results));
		}
		if (vote.results) {
			vote.numAllowedToVote = vote.results.numAllowedToVote;
		}
		console.log(vote.results);

		return vote;
	}));
}
