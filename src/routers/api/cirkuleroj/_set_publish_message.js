import { removeUnsafeChars } from '../../../util';

async function set_publish_message (req, res, next) {
	/**
	 * POST /set_publish_message
	 * Sets the default cirkulero publish message and email address
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   message (string)
	 *   email   (string)
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'message',
		'email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}
	const message = removeUnsafeChars(req.body.message);

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}
	const email = removeUnsafeChars(req.body.email);

	const stmt = CR.db.cirkuleroj.prepare('update settings set value = ? where key = ?');
	stmt.run(message, "publish_message");
	stmt.run(email, "publish_email");

	res.sendAPIResponse();
}

export default set_publish_message;
