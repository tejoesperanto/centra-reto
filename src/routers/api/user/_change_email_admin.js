import { removeUnsafeCharsOneLine } from '../../../util';
import User from '../../../api/user';

async function change_email_admin (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /change_email_admin
	 * Changes a user's primary email address
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.modify
	 * 
	 * Parameters:
	 * user_id (number) The user's id
	 * email   (string) The new email address
	 *                  Max length: 500 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * USER_NOT_FOUND
	 * EMAIL_TAKEN
	 */
	
	if (!await req.requirePermissions('users.modify')) { return; }
	
	const fields = [
		'user_id',
		'email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.user_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['user_id']);
		return;
	}

	if (typeof req.body.email !== 'string' || req.body.email.length > 500) {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		res.sendAPIError('USER_NOT_FOUND');
		return;
	}

	const email = removeUnsafeCharsOneLine(req.body.email);

	if (User.isEmailTaken(email)) {
		res.sendAPIError('EMAIL_TAKEN');
		return;
	}

	await user.changeEmail(email, false);

	res.sendAPIResponse();
}

export default change_email_admin;
