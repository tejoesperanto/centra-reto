async function delete_reminder_list (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /delete_reminder_list
	 * Deletes a list reminder
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   id (number) The id of the cirkulero reminder
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND            No cirkulero with the given id was found
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['id']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('delete from reminders_lists where id = ?');
	const info = stmt.run(req.body.id);

	if (info.changes === 0) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default delete_reminder_list;
