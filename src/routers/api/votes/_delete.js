async function vote_delete (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /delete
	 * Deletes a vote
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * id (integer) The id of the vote
	 *
	 * Permissions required:
	 * votes.manage
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * VOTE_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('votes.manage')) { return; }

	const fields = [
		'id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		return res.sendAPIError('INVALID_ARGUMENT', ['id']);
	}

	const deleted = CR.db.votes.prepare('DELETE FROM votes WHERE id = ?').run(req.body.id);

	if (deleted) {
		res.sendAPIResponse({});
	} else {
		res.sendAPIError('VOTE_NOT_FOUND');
	}
}

export default vote_delete;
