import { removeUnsafeChars, removeUnsafeCharsOneLine } from '../../../util';

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
	 *   list_email (string) The email address of the list
	 *                       Max length: 500 chars
	 *   delta_time (number) The delta time
	 *   message    (string) The message
	 *                       Max length: 5000 chars
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

	if (typeof req.body.list_email !== 'string' || req.body.list_email.length > 500) {
		res.sendAPIError('INVALID_ARGUMENT', ['list_email']);
		return;
	}
	const listEmail = removeUnsafeCharsOneLine(req.body.list_email);

	if (!Number.isSafeInteger(req.body.delta_time) || req.body.delta_time < 1) {
		res.sendAPIError('INVALID_ARGUMENT', ['delta_time']);
		return;
	}

	if (typeof req.body.message !== 'string' || req.body.message.length > 5000) {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}
	const message = removeUnsafeChars(req.body.message);

	const stmt = CR.db.cirkuleroj.prepare('insert into reminders_lists (list_email, delta_time, message) values (?, ?, ?)');
	const info = stmt.run(listEmail, req.body.delta_time, message);

	res.sendAPIResponse({
		id: info.lastInsertRowid
	});
}

export default insert_reminder_list;
