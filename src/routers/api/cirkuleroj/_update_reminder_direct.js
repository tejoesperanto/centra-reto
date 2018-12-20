import { removeUnsafeChars } from '../../../util';

async function update_reminder_direct (req, res, next) {
	/**
	 * POST /update_reminder_direct
	 * Updates a direct reminder
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   id         (number) The id of the cirkulero reminder
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
		'delta_time',
		'message'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['id']);
		return;
	}

	if (!Number.isSafeInteger(req.body.delta_time) || req.body.delta_time < 1) {
		res.sendAPIError('INVALID_ARGUMENT', ['delta_time']);
		return;
	}

	if (typeof req.body.message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('update reminders_direct set delta_time = ?, message = ? where id = ?');
	const info = stmt.run(req.body.delta_time, removeUnsafeChars(req.body.message), req.body.id);

	if (info.changes === 0) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default update_reminder_direct;
