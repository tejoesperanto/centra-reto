import { removeUnsafeChars, removeUnsafeCharsOneline } from '../../../util';

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
	 *   message (string) Max length: 5000 charss
	 *   email   (string) Max length: 500 chars
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

	if (typeof req.body.message !== 'string' || req.body.message.length > 5000) {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}
	const message = removeUnsafeChars(req.body.message);

	if (typeof req.body.email !== 'string' || req.body.email.length > 500) {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}
	const email = removeUnsafeCharsOneLine(req.body.email);

	const stmt = CR.db.cirkuleroj.prepare('update settings set value = ? where key = ?');
	stmt.run(message, "publish_message");
	stmt.run(email, "publish_email");

	res.sendAPIResponse();
}

export default set_publish_message;
