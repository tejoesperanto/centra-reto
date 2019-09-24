import moment from 'moment-timezone';
import { promisify } from 'util';
import _csvStringify from 'csv-stringify';
const csvStringify = promisify(_csvStringify);

import { removeUnsafeChars, removeUnsafeCharsOneLine } from '../../../util';
import Group from '../../../api/group';

async function vote_create (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /create
	 * Creates a new vote
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * name        (string)   The title of the vote
	 *                        Max length: 100 chars
	 *                       
	 * description (string)   A description of the vote
	 *                        Max length: 2000 chars
	 *
	 * type        (string)   The voting system used
	 *                        Must be one of: jns, pr, utv
	 *
	 * timeTo      (integer)  The unix epoch time of the deadline
	 *
	 * quorum      (number)   (Optional) The quorum required for the vote to pass
	 *
	 * majority    (number)   (Optional) The majority required for the vote to pass
	 *
	 * majorityMustBeGreater (boolean) (Optional) Whether the majority must be exceeded.
	 *                                 Default: false
	 *
	 * numWinners  (integer)  (Optional) The number of winners to be found
	 *
	 * opts        (string[]) (Optional) The valid ballot options (for pr and utv), no more than 100 entries
	 *
	 * secret      (boolean)  Whether information on how each voter voted should be kept secret
	 *
	 * groups      (integer[]) The groups allowed to vote
	 *
	 * Permissions required:
	 * votes.manage
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * GROUP_NOT_FOUND  [id]
	 *
	 * Returns:
	 * id (number) The vote's id
	 */
	
	if (!await req.requirePermissions('votes.manage')) { return; }

	const fields = [
		'name',
		'description',
		'type',
		'timeTo',
		'secret',
		'groups'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.name !== 'string' || req.body.name.length > 100) {
		return res.sendAPIError('INVALID_ARGUMENT', ['name']);
	}

	if (typeof req.body.description !== 'string' || req.body.description.length > 2000) {
		return res.sendAPIError('INVALID_ARGUMENT', ['description']);
	}

	const validTypes = [ 'jns', 'pr', 'utv' ];
	if (!validTypes.includes(req.body.type)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['type']);
	}

	if (!Number.isSafeInteger(req.body.timeTo) || req.body.timeTo < moment().unix()) {
		return res.sendAPIError('INVALID_ARGUMENT', ['timeTo']);
	}

	if (!('quorum' in req.body)) {
		req.body.quorum = 0;
	}
	if (!Number.isFinite(req.body.quorum) || req.body.quorum < 0) {
		return res.sendAPIError('INVALID_ARGUMENT', ['quorum']);
	}

	if (!('majority' in req.body)) {
		req.body.majority = 0;
	}
	if (!Number.isFinite(req.body.majority) || req.body.majority < 0) {
		return res.sendAPIError('INVALID_ARGUMENT', ['majority']);
	}

	if (!('majorityMustBeGreater' in req.body)) {
		req.body.majorityMustBeGreater = false;
	}
	if (typeof req.body.majorityMustBeGreater !== 'boolean') {
		return res.sendAPIError('INVALID_ARGUMENT', ['majorityMustBeGreater']);
	}

	if (!('numWinners' in req.body)) {
		req.body.numWinners = 1;
	}
	if (!Number.isSafeInteger(req.body.numWinners)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['numWinners']);
	}

	if (!('opts' in req.body)) {
		req.body.opts = [];
	}
	if (!Array.isArray(req.body.opts) || req.body.opts.length > 100) {
		return res.sendAPIError('INVALID_ARGUMENT', ['opts']);
	}
	for (let opt of req.body.opts) {
		if (typeof opt !== 'string' || opt.length < 1 || opt.length > 500) {
			return res.sendAPIError('INVALID_ARGUMENT', ['opts']);
		}
	}

	if (typeof req.body.secret !== 'boolean') {
		return res.sendAPIError('INVALID_ARGUMENT', ['secret']);
	}

	if (!Array.isArray(req.body.groups)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['groups']);
	}
	for (let group of req.body.groups) {
		if (!Number.isSafeInteger(group)) {
			return res.sendAPIError('INVALID_ARGUMENT', ['groups']);
		}
	}
	// Remove duplicates
	req.body.groups = [...new Set(req.body.groups)];
	// Make sure the groups exist
	const groups = await Promise.all(req.body.groups.map(groupId => {
		return Group.getGroupById(groupId);
	}));

	for (let i = 0; i < groups.length; i ++) {
		const group = groups[i];
		const groupId = req.body.groups[i];
		if (group === null) {
			res.sendAPIError('GROUP_NOT_FOUND', [groupId]);
			return;
		}
	}

	// END DATA VALIDATION

	const stmt = CR.db.votes.prepare(`INSERT INTO votes
		(name, description, type, timeFrom, timeTo, quorum, majority, majorityMustBeGreater, numWinners, opts, secret)
		VALUES (@name, @description, @type, @timeFrom, @timeTo, @quorum, @majority, @majorityMustBeGreater, @numWinners, @opts, @secret)`);
	const info = stmt.run({
		name: removeUnsafeCharsOneLine(req.body.name),
		description: removeUnsafeChars(req.body.description),
		type: req.body.type,
		timeFrom: moment().unix(),
		timeTo: req.body.timeTo,
		quorum: req.body.quorum,
		majority: req.body.majority,
		majorityMustBeGreater: +req.body.majorityMustBeGreater,
		numWinners: req.body.numWinners,
		opts: (await csvStringify([req.body.opts.map(removeUnsafeCharsOneLine)])).trim(),
		secret: +req.body.secret
	});

	const insertGroupStmt = CR.db.votes.prepare('INSERT INTO votes_groups (vote_id, group_id) VALUES (?, ?)');
	const insertManyGroups = CR.db.votes.transaction(groups => {
		for (const group of groups) insertGroupStmt.run(info.lastInsertRowid, group);
	});
	insertManyGroups(req.body.groups);

	res.sendAPIResponse({
		id: info.lastInsertRowid
	});
}

export default vote_create;
