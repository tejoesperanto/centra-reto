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
	router.post('/initial_setup', wrap(initialSetup));

	return router;
}

async function activateUser (req, res, next) {
	/**
	 * POST /activate
	 * Activates an account
	 *
	 * Login not required
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
	 */
	
	req.logout();

	CRApi.sendResponse(res);
}

async function initialSetup (req, res, next) {
	/**
	 * POST /initial_setup
	 * Performs the initial profile setup procedure
	 *
	 * Login required
	 *
	 * Parameters:
	 * full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 * [full_name_native]   (string)      The user's full name written in the native writing system in the native order
	 * full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 * nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 * [pet_name]           (string)      (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 * pronouns             (string|null) The user's pronouns (li, ri, ŝi) in csv format. If null the user's nickname is used in generated text.
	 *
	 * Throws:
	 * NOT_LOGGED_IN
	 * ALREADY_COMPLETED            The user has already completed the initial setup
	 * MISSING_ARGUMENT [parameter]
	 * INVALID_PRONOUN  [pronoun]   One of the indicated pronouns isn't in the allowed list
	 */
	
	if (!req.user) {
		CRApi.sendError(res, 'NOT_LOGGED_IN');
		return;
	}

	if (req.user.hasCompletedInitialSetup()) {
		CRApi.sendError(res, 'ALREADY_COMPLETED');
		return;
	}

	const fields = [
		'full_name_latin',
		'full_name_latin_sort',
		'nickname',
		'pronouns'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	let fullNameLatin = req.body.full_name_latin.toString();
	let fullNameNative = null;
	if (req.body.full_name_native) {
		fullNameNative = req.body.full_name_native.toString();
	}
	let fullNameLatinSort = req.body.full_name_latin_sort.toString();
	let nickname = req.body.nickname.toString();
	let petName = null;
	if (req.body.pet_name) {
		petName = req.body.pet_name.toString();
	}
	let pronouns = req.body.pronouns;
	if (pronouns !== null) {
		pronouns = pronouns.toString();
		const pronounsArr = pronouns.split(',');
		for (let pronoun of pronounsArr) {
			if (['li','ri','ŝi'].indexOf(pronoun) === -1) {
				CRApi.sendError(res, 'INVALID_PRONOUN', [pronoun]);
				return;
			}
		}
	}

	req.user.initialSetup(fullNameLatin, fullNameNative, fullNameLatinSort, nickname, petName, pronouns);

	CRApi.sendResponse(res);
}
