import User from '../../../api/user';

async function reset_password_email (req, res, next) {
	/**
	 * POST /reset_password_email
	 * Sends a password reset mail to a given user. If the email is not found it still counts as a success.
	 *
	 * Login not permitted
	 *
	 * Parameters:
	 * email (string) The email of the user whose password must be reset
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * LOGGED_IN
	 */

	 if (req.user) {
	 	res.sendAPIError('LOGGED_IN');
	 	return;
	 }

	const fields = [
		'email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	res.sendAPIResponse(); // We do this now to prevent timing attacks on the email address

	const user = User.getUserByEmail(req.body.email);
	if (!user || !user.enabled) { return; }
	await user.generatePasswordReset();
}

export default reset_password_email;
