import passport from 'passport';

async function user_login (req, res, next) {
	/**
	 * POST /login
	 * Logs in
	 *
	 * Must not be logged in
	 *
	 * Parameters:
	 * email          (string) The user's primary email
	 * password       (string) The user's plain text password
	 *
	 * Throws:
	 * ALREADY_LOGGED_IN
	 * USER_NOT_FOUND The email/password combination was not found
	 *
	 * Returns:
	 * id (number) The user's id
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */

	 if (req.user) {
	 	res.sendAPIError('ALREADY_LOGGED_IN');
	 	return;
	 }
	
	const fields = [
		'email',
		'password'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	if (typeof req.body.password !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['password']);
		return;
	}

	passport.authenticate('local', (err, user, info) => {
		if (err) { return next(err); }
		if (!user) {
			res.sendAPIError('USER_NOT_FOUND');
			return;
		}
		req.logIn(user, err => {
			if (err) { return next(err); }
			res.sendAPIResponse({
				id: user.id
			});
		});
	})(req, res, next);
}

export default user_login;
