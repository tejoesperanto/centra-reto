import { removeUnsafeChars } from '../../../util';

async function insert_reminder_direct (req, res, next) {
	/**
	 * POST /insert_reminder_direct
	 * Inserts a direct reminder
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
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
		'delta_time',
		'message'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.delta_time) || req.body.delta_time < 1) {
		res.sendAPIError('INVALID_ARGUMENT', ['delta_time']);
		return;
	}

	if (typeof req.body.message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('insert into reminders_direct (delta_time, message) values (?, ?)');
	const info = stmt.run(req.body.delta_time, removeUnsafeChars(req.body.message));

	res.sendAPIResponse({
		id: info.lastInsertRowid
	});
}

export default insert_reminder_direct;
