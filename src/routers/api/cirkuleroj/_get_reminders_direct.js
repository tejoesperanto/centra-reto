async function get_reminders_direct (req, res, next) {
	/**
	 * POST /get_reminders_direct
	 * Gets all direct reminders
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
	 *   delta_time (number) The delta time before the deadline to send the reminder
	 *   message    (string) The message to send
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const stmt = CR.db.cirkuleroj.prepare('select id, delta_time, message from reminders_direct order by delta_time desc');
	const rows = stmt.all()

	res.sendAPIResponse({
		reminders: rows
	});
}

export default get_reminders_direct;
