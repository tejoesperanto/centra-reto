import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';

import * as CRApi from '.';
import User from '../../api/user';
import { wrap } from '..';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	router.post('/activate', wrap(activateUser));
	router.post('/login', CR.loginLimiter, wrap(login));
	router.post('/logout', wrap(logout));

	return router;
}

async function activateUser (req, res, next) {
	/**
	 * POST /activate
	 * Activates an account
	 *
	 * Login not required
	 * No permissions required
	 *
	 * Parameters:
	 * activation_key (string) The activation key for the user's account
	 * email          (string) The user's primary email
	 * password       (string) The user's plain text password
	 *
	 * Throws:
	 * MISSING_ARGUMENT       [parameter]
	 * INVALID_ACTIVATION_KEY []          The email and activation key combination was not found
	 *
	 * Returns:
	 * uid (number) The user's id
	 */

	const fields = [
		'activation_key',
		'email',
		'password'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	// Validate the account activation key and obtain the user id
	let stmt = CR.db.users.prepare("select id from users where email = ? and activation_key = ?");
	let row = stmt.get(req.body.email, req.body.activation_key);
	if (!row) {
		CRApi.sendError(res, 'INVALID_ACTIVATION_KEY');
		return;
	}

	const uid = row.id;

	// Hash the password
	const hashedPassword = await User.hashPassword(req.body.password.toString());

	// Activate the user
	const user = User.getUserById(uid);
	user.activate(hashedPassword);

	CRApi.sendResponse(res, {
		uid: uid
	});
}

async function login (req, res, next) {
	/**
	 * POST /login
	 * Logs in
	 *
	 * Login not required
	 * No permissions required
	 *
	 * Parameters:
	 * email          (string) The user's primary email
	 * password       (string) The user's plain text password
	 *
	 * Throws:
	 * MISSING_ARGUMENT [parameter]
	 * USER_NOT_FOUND   []          The email/password combination was not found
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

async function logout (req, res, next) {
	/**
	 * POST /logout
	 * Logs out
	 *
	 * Login not required
	 * No permissions required
	 */
	
	req.logout();

	CRApi.sendResponse(res);
}
