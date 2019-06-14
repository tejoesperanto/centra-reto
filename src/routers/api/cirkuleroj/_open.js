async function open (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /open
	 * Opens a cirkulero for contributions
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero to open
	 *   
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set open = 1 where id = ?');
	const info = stmt.run(req.body.cirkulero_id);

	if (info.changes === 0) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default open;
