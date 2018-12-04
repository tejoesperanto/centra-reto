async function update_reminder_list (req, res, next) {
	/**
	 * POST /update_reminder_list
	 * Updates a list reminder
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   id         (number) The id of the cirkulero
	 *   list_email (string) The new email address of the list
	 *   delta_time (number) The new delta time
	 *   message    (string) The new message
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND            No cirkulero with the given id was found
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'id',
		'list_email',
		'delta_time',
		'message'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['id']);
		return;
	}

	if (typeof req.body.list_email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['list_email']);
		return;
	}

	if (!Number.isSafeInteger(req.body.delta_time)) {
		res.sendAPIError('INVALID_ARGUMENT', ['delta_time']);
		return;
	}

	if (typeof req.body.message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('update reminders_lists set list_email = ?, delta_time = ?, message = ? where id = ?');
	const info = stmt.run(req.body.list_email, req.body.delta_time, req.body.message, req.body.id);

	if (info.changes === 0) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default update_reminder_list;
