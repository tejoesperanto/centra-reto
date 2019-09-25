import moment from 'moment-timezone';
import { promisify } from 'util';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

async function vote_vote (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /vote
	 * Submits a ballot in a vote
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * id     (integer) The id of the vote
	 * ballot (string|integer[][]) The ballot
	 *                             For votes of type jns this must be a string with the value j, n or s
	 *                             For votes of type pr or utv this must be a unique integer[][]
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * VOTE_NOT_FOUND
	 * ALREADY_VOTED
	 */

	const fields = [
		'id',
		'ballot'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['id']);
	}

	const vote = CR.db.votes.prepare('SELECT type, opts, timeTo FROM votes where id = ?').get(req.body.id);
	if (!vote || vote.timeTo < moment().unix()) {
		return res.sendAPIError('VOTE_NOT_FOUND');
	}

	const hasVoted = CR.db.votes.prepare('SELECT 1 FROM votes_ballots where vote_id = ? and user_id = ?').get(req.body.id, req.user.id);
	if (hasVoted) {
		return res.sendAPIError('ALREADY_VOTED');
	}

	const groups = await req.user.getGroups();
	const groupIds = [...groups.values()].map(x => x.group.id);
	const mayVoteParams = '?,'.repeat(groupIds.length).slice(0, -1);
	const mayVote = CR.db.votes.prepare(`SELECT 1 from votes_groups where vote_id = ? and group_id in (${mayVoteParams})`).get(req.body.id, ...groupIds);
	if (!mayVote) {
		return res.sendAPIError('VOTE_NOT_FOUND');
	}

	if (vote.opts) { vote.opts = (await csvParse(vote.opts))[0]; }

	let ballot;
	if (vote.type === 'jns') {
		if (typeof req.body.ballot !== 'string' || !'jns'.includes(req.body.ballot)) {
			return res.sendAPIError('INVALID_ARGUMENT', ['ballot']);
		}
		ballot = req.body.ballot;
	} else {
		if (!Array.isArray(req.body.ballot)) {
			return res.sendAPIError('INVALID_ARGUMENT', ['ballot']);
		}
		const usedIndices = [];
		for (const indexArr of req.body.ballot) {
			if (!Array.isArray(indexArr)) {
				return res.sendAPIError('INVALID_ARGUMENT', ['ballot']);
			}
			if (vote.type === 'utv' && indexArr.length > 1) {
				return res.sendAPIError('INVALID_ARGUMENT', ['ballot']);
			}
			for (const index of indexArr) {
				if (!Number.isSafeInteger(index) ||
				index < 0 ||
				index >= vote.opts.length ||
				usedIndices.includes(index)) {
					return res.sendAPIError('INVALID_ARGUMENT', ['ballot']);
				}
				usedIndices.push(index);
			}
		}
		ballot = req.body.ballot.map(x => x.join(',')).join('\n');
	}

	CR.db.votes.prepare('insert into votes_ballots (vote_id, user_id, ballot) values (?, ?, ?)')
		.run(req.body.id, req.user.id, ballot);

	res.sendAPIResponse({});
}

export default vote_vote;
