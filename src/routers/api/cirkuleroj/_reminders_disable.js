async function reminders_disable (req, res, next) {
	/**
	 * POST /reminders_disable
	 * Disables reminders for a cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
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

	// Disable reminders
	const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set reminders = 0 where id = ?');
	stmt.run(req.body.cirkulero_id);

	res.sendAPIResponse();
}

export default reminders_disable;
