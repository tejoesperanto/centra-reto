async function delete_cirkulero (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /delete
	 * Deletes a cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero to remove
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

	const stmt = CR.db.cirkuleroj.prepare('delete from cirkuleroj where id = ?');
	const info = stmt.run(req.body.cirkulero_id);

	if (info.changes === 0) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default delete_cirkulero;
