import User from '../../../api/user';

async function user_activate (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /activate
	 * Activates an account
	 *
	 * Login not required
	 *
	 * Parameters:
	 * activation_key (string) The activation key for the user's account
	 * email          (string) The user's primary email
	 * password       (string) The user's plaintext password
	 *
	 * Throws:
	 * INVALID_ACTIVATION_KEY            The email and activation key combination was not found
	 * INVALID_ARGUMENT       [argument]
	 *
	 * Returns:
	 * uid (number) The user's id
	 */

	const fields = [
		'activation_key',
		'email',
		'password'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.activation_key !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['activation_key']);
		return;
	}

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	if (typeof req.body.password !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['password']);
		return;
	}

	// Validate the account activation key and obtain the user id
	let stmt = CR.db.users.prepare('select id from users where email = ? and activation_key = ? and enabled = 1');
	let row = stmt.get(req.body.email, req.body.activation_key);
	if (!row) {
		res.sendAPIError('INVALID_ACTIVATION_KEY');
		return;
	}

	// Hash the password
	const hashedPassword = await User.hashPassword(req.body.password);

	// Activate the user
	const user = User.getUserById(row.id);
	user.activate(hashedPassword);

	res.sendAPIResponse({
		uid: row.id
	});
}

export default user_activate;
