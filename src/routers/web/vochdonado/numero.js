import moment from 'moment-timezone';
import { promisify } from 'util';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const vote = CR.db.votes.prepare('SELECT * from votes where id = ?').get(req.params.id);
	if (!vote || vote.timeTo < moment().unix()) {
		return next();
	}

	const hasVoted = CR.db.votes.prepare('SELECT 1 FROM votes_ballots where vote_id = ? and user_id = ?').get(req.params.id, req.user.id);
	if (hasVoted) {
		return next();
	}

	const groups = await req.user.getGroups();
	const groupIds = [...groups.values()].map(x => x.group.id);
	const mayVoteParams = '?,'.repeat(groupIds.length).slice(0, -1);
	const mayVote = CR.db.votes.prepare(`SELECT 1 from votes_groups where vote_id = ? and group_id in (${mayVoteParams})`).get(req.params.id, ...groupIds);
	if (!mayVote) {
		return next();
	}

	vote.opts = (await csvParse(vote.opts))[0];

	const data = {
		title: `« ${vote.name} » | Reta voĉdonado`,
		scripts: [
			'/js/cr/main/vochdonado/numero.js'
		],
		page: {
			vote
		},
		pageDataObj: {
			vote: {
				id: vote.id,
				type: vote.type,
				opts: vote.opts
			}
		}
	};

	await res.sendRegularPage('vochdonado/numero', data);
}

export default index;
