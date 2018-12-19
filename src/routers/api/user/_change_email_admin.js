import { removeUnsafeCharsOneLine } from '../../../util';
import User from '../../../api/user';

async function change_email_admin (req, res, next) {
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
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * USER_NOT_FOUND
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

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		res.sendAPIError('USER_NOT_FOUND');
		return;
	}

	const email = removeUnsafeCharsOneLine(req.body.email);

	const stmt = CR.db.users.prepare('update users set email = ? where id = ?');
	stmt.run(email, user.id);
	user.email = email;

	res.sendAPIResponse();
}

export default change_email_admin;
