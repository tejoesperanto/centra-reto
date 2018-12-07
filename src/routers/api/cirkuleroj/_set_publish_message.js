import { removeUnsafeChars } from '../../../util';

async function set_publish_message (req, res, next) {
	/**
	 * POST /set_publish_message
	 * Sets the default cirkulero publish message
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   message (string)
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'message'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}
	const message = removeUnsafeChars(req.body.message);

	const stmt = CR.db.cirkuleroj.prepare('update settings set value = ? where key = "publish_message"');
	stmt.run(message);

	res.sendAPIResponse();
}

export default set_publish_message;
