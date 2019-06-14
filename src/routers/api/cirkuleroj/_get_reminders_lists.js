async function get_reminders_list (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /get_reminders_list
	 * Gets all reminders for lists
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Returns:
	 * rows (Object[]) The reminders
	 *   id         (number) The id of the reminder, only used internally
	 *   list_email (string) The email address of the list
	 *   delta_time (number) The delta time before the deadline to send the reminder
	 *   message    (string) The message to send
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const stmt = CR.db.cirkuleroj.prepare('select id, list_email, delta_time, message from reminders_lists order by delta_time desc');
	const rows = stmt.all();

	res.sendAPIResponse({
		reminders: rows
	});
}

export default get_reminders_list;
