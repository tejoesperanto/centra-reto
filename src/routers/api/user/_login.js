import passport from 'passport';

async function user_login (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /login
	 * Logs in
	 *
	 * Parameters:
	 * email          (string) The user's primary email
	 * password       (string) The user's plain text password
	 *
	 * Throws:
	 * USER_NOT_FOUND The email/password combination was not found
	 *
	 * Returns:
	 * id (number) The user's id
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
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

	if (req.user) {
		req.logout();
	}

	passport.authenticate('local', (err, user, info) => { // eslint-disable-line no-unused-vars
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
