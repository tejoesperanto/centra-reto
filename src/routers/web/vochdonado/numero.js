import moment from 'moment-timezone';
import { promisify } from 'util';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import { tieBreakerGroupId } from '../../../api/vote';

async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const vote = CR.db.votes.prepare('SELECT * from votes where id = ?').get(req.params.id);
	if (!vote) {
		return next();
	}

	const userGroups = await req.user.getGroups();
	const isTieBreakerUser = userGroups.has(tieBreakerGroupId);
	let isTieBreaker = false;
	if (isTieBreakerUser) {
		let voteResults = CR.db.votes.prepare('SELECT results from votes_results where id = ?').get(req.params.id);
		if (voteResults) {
			voteResults = JSON.parse(voteResults.results);
			if (voteResults.result === 'TIE_BREAKER_NEEDED') {
				isTieBreaker = true;
			}
		}
	}

	if (!isTieBreaker) {
		if (vote.timeTo < moment().unix()) {
			return next();
		}

		const hasVoted = CR.db.votes.prepare('SELECT 1 FROM votes_ballots where vote_id = ? and user_id = ?').get(req.params.id, req.user.id);
		if (hasVoted) {
			return next();
		}

		const groupIds = [...userGroups.values()].map(x => x.group.id);
		const mayVoteParams = '?,'.repeat(groupIds.length).slice(0, -1);
		const mayVote = CR.db.votes.prepare(`SELECT 1 from votes_groups where vote_id = ? and group_id in (${mayVoteParams})`).get(req.params.id, ...groupIds);
		if (!mayVote) {
			return next();
		}
	}

	vote.opts = (await csvParse(vote.opts))[0];

	const data = {
		title: `« ${vote.name} » | Reta voĉdonado`,
		scripts: [
			'/js/cr/main/vochdonado/numero.js'
		],
		page: {
			vote,
			isTieBreaker
		},
		pageDataObj: {
			vote: {
				id: vote.id,
				type: vote.type,
				opts: vote.opts
			},
			isTieBreaker
		}
	};

	await res.sendRegularPage('vochdonado/numero', data);
}

export default index;
