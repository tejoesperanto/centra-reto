import bcrypt from 'bcrypt';

import User from '../../../api/user';

async function change_password (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /change_password
	 * Changes the user's password
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * password_old (string) The old password
	 * password_new (string) The new password
	 *
	 * Throws:
	 * INVALID_ARGUMENT   [argument]
	 * WRONG_OLD_PASSWORD
	 */
	
	const fields = [
		'password_old',
		'password_new'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.password_old !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['password_old']);
		return;
	}

	if (typeof req.body.password_new !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['password_new']);
		return;
	}

	const passwordRight = await bcrypt.compare(req.body.password_old, req.user.password);
	if (!passwordRight) {
		res.sendAPIError('WRONG_OLD_PASSWORD');
		return;
	}

	const hashedPassword = await User.hashPassword(req.body.password_new);
	req.user.updatePassword(hashedPassword);

	res.sendAPIResponse();
}

export default change_password;
