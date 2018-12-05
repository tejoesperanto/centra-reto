async function insert_reminder_list (req, res, next) {
	/**
	 * POST /insert_reminder_list
	 * Inserts a list reminder
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   list_email (string) The new email address of the list
	 *   delta_time (number) The new delta time
	 *   message    (string) The new message
	 *
	 * Returns:
	 *   id (number) The id of the reminder
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'list_email',
		'delta_time',
		'message'
	];
	if (!req.handleRequiredFields(fields)) { return; }

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

	const stmt = CR.db.cirkuleroj.prepare('insert into reminders_lists (list_email, delta_time, message) values (?, ?, ?)');
	const info = stmt.run(req.body.list_email, req.body.delta_time, req.body.message);

	res.sendAPIResponse({
		id: info.lastInsertRowid
	});
}

export default insert_reminder_list;
