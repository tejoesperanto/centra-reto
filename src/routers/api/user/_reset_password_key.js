import User from '../../../api/user';

async function reset_password_key (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /reset_password_key
	 * Resets a user's password using a password reset key.
	 *
	 * Login not permitted
	 *
	 * Parameters:
	 * email    (string) The email of the user
	 * key      (string) The password reset key
	 * password (string) The new plaintext password (will be encrypted prior to storing)
	 *
	 * Throws:
	 * INVALID_ARGUMENT  [argument]
	 * LOGGED_IN
	 * INVALID_RESET_KEY            The combination of email and reset key was not found
	 */

	if (req.user) {
		res.sendAPIError('LOGGED_IN');
		return;
	}

	const fields = [
		'email',
		'key',
		'password'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	if (typeof req.body.key !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['key']);
		return;
	}

	if (typeof req.body.password !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['password']);
		return;
	}

	const user = User.getUserByEmail(req.body.email);
	if (!user || !user.enabled) {
		res.sendAPIError('INVALID_RESET_KEY');
		return;
	}

	let stmt = CR.db.users.prepare('select 1 from users_password_reset where user_id = ? and key = ?');
	const row = stmt.get(user.id, req.body.key);

	if (!row) {
		res.sendAPIError('INVALID_RESET_KEY');
		return;
	}

	const hashedPassword = await User.hashPassword(req.body.password);
	user.updatePassword(hashedPassword);

	stmt = CR.db.users.prepare('delete from users_password_reset where user_id = ?');
	stmt.run(user.id);

	res.sendAPIResponse();
}

export default reset_password_key;
