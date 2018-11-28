import passport from 'passport';

import * as CRApi from '..';

async function user_login (req, res, next) {
	/**
	 * POST /login
	 * Logs in
	 *
	 * Login not required
	 * Initial setup not required
	 *
	 * Parameters:
	 * email          (string) The user's primary email
	 * password       (string) The user's plain text password
	 *
	 * Throws:
	 * USER_NOT_FOUND The email/password combination was not found
	 *
	 * Returns:
	 * uid (number) The user's id
	 */
	
	const fields = [
		'email',
		'password'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	passport.authenticate('local', (err, user, info) => {
		if (err) { return next(err); }
		if (!user) {
			CRApi.sendError(res, 'USER_NOT_FOUND');
			return;
		}
		req.logIn(user, err => {
			if (err) { return next(err); }
			CRApi.sendResponse(res, {
				uid: user.id
			});
		});
	})(req, res, next);
}

export default user_login;
