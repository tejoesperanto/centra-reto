import moment from 'moment-timezone';

async function vote_extend (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /extend
	 * Extends a vote's timeTo. Only works on votes that haven't already expired
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * id     (integer) The id of the vote
	 * timeTo (integer) The new timeTo, must be greater than or equal to the existing
	 *
	 * Permissions required:
	 * votes.manage
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * VOTE_NOT_FOUND
	 * VOTE_EXPIRED
	 */
	
	if (!await req.requirePermissions('votes.manage')) { return; }

	const fields = [
		'id',
		'timeTo'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['id']);
	}

	if (!Number.isSafeInteger(req.body.timeTo)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['timeTo']);
	}

	const data = CR.db.votes.prepare('SELECT timeTo from votes where id = ?').get(req.body.id);
	if (!data) {
		return res.sendAPIError('VOTE_NOT_FOUND');
	}
	if (data.timeTo <= moment().unix()) {
		return res.sendAPIError('VOTE_EXPIRED');
	}
	if (data.timeTo > req.body.timeTo) {
		return res.sendAPIError('INVALID_ARGUMENT', ['timeTo']);
	}

	CR.db.votes.prepare('UPDATE votes SET timeTo = @timeTo WHERE id = @id')
		.run({
			id: req.body.id,
			timeTo: req.body.timeTo
		});

	res.sendAPIResponse({});
}

export default vote_extend;
