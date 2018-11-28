import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';

import * as CRMail from '../../mail';
import * as CRApi from '.';
import User from '../../api/user';
import { wrap } from '..';
import { removeUnsafeChars, removeUnsafeCharsOneLine } from '../../util';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	router.post('/activate', wrap(activateUser));
	router.post('/list', CRApi.requireInitialSetup, wrap(listUsers));
	router.post('/login', CR.loginLimiter, wrap(login));
	router.post('/logout', wrap(logout));
	router.post('/create', CRApi.requireInitialSetup, wrap(createUser));
	router.post('/toggle_enabled', CRApi.requireInitialSetup, wrap(toggleEnabled));
	router.post('/initial_setup', CRApi.requireLogin, wrap(initialSetup));

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
	 * INVALID_ACTIVATION_KEY The email and activation key combination was not found
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
	let stmt = CR.db.users.prepare("select id from users where email = ? and activation_key = ? and enabled = 1");
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

async function listUsers (req, res, next) {
	/**
	 * POST /list
	 * Lists all users
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.view
	 *
	 * Parameters:
	 * See routers/api#generateListQueryStatement
	 *
	 * Permitted cols:
	 * id, full_name_latin, full_name_native, full_name_latin_sort, nickname, pet_name, email, enabled, activation_key_time
	 * 
	 * Returns:
	 * rows_total    (number)   The amount of rows in the table in total
	 * rows_filtered (number)   The amount of rows in the table after filtering
	 * data          (Object[]) The rows
	 *   id                   (number)      The user's id
	 *   name                 (string)      The user's full name with the optional pet name in parenthesis at the end
	 *   full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 *   full_name_native     (string|null) The user's full name written in the native writing system in the native order
	 *   full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 *   nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 *   pet_name             (string|null) (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 *   email                (string)      The user's primary email address
	 *   enabled              (boolean)     Whether the user is enabled
	 *   active               (boolean)     Whether the user has activated their account
	 *   set_up               (boolean)     Whether the user has completed the initial setup
	 *   activation_key_time  (number)      The time the user's activation key expires
	 * 
	 * Throws:
	 * See routers/api#generateListQueryStatement
	 */
	
	if (!(await req.user.hasPermission('users.view'))) {
		CRApi.sendError(res, 'MISSING_PERMISSION');
		return;
	}

	const table = 'users left join users_details on users_details.user_id = users.id';
	const dbData = CRApi.performListQueryStatement(req, res, CR.db.users, table, [
		'id',
		'full_name_latin',
		'full_name_native',
		'full_name_latin_sort',
		'nickname',
		'pet_name',
		'email',
		'enabled',
		'activation_key',
		'activation_key_time'
		], [
		'id',
		'full_name_latin',
		'full_name_native',
		'full_name_latin_sort',
		'nickname',
		'pet_name',
		'email',
		'enabled',
		'activation_key'
		]);

	if (!dbData) { return; }

	const output = dbData.data.map(row => {
		const setUp = !!row.full_name_latin; // This key is only present if the initial set up has been completed
		return {
			id: row.id,
			name: User.formatLongName(row.full_name_latin, row.pet_name),
			full_name_latin: row.full_name_latin,
			full_name_native: row.full_name_native,
			full_name_latin_sort: row.full_name_latin_sort,
			nickname: row.nickname,
			pet_name: row.pet_name,
			email: row.email,
			enabled: !!row.enabled,
			active: !row.activation_key_time,
			set_up: setUp,
			activation_key: row.activation_key,
			activation_key_time: row.activation_key_time
		};
	});

	CRApi.sendResponse(res, {
		data: output,
		rows_total: dbData.rowsTotal,
		rows_filtered: dbData.rowsFiltered
	});
}

async function login (req, res, next) {
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

async function logout (req, res, next) {
	/**
	 * POST /logout
	 * Logs out
	 *
	 * Login not required
	 * Initial setup not required
	 */
	
	req.logout();

	CRApi.sendResponse(res);
}

async function createUser (req, res, next) {
	/**
	 * POST /create
	 * Creates a new user
	 *
	 * email      (string)  The email of the user
	 * send_email (boolean) Whether to send an email with the activation link
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.create
	 *
	 * Throws:
	 * EMAIL_TAKEN
	 *
	 * Returns:
	 * uid            (number) The user's id
	 * activation_key (string) The user's activation key
	 */
	
	if (!(await req.user.hasPermission('users.create'))) {
		CRApi.sendError(res, 'MISSING_PERMISSION');
		return;
	}

	const fields = [
		'email',
		'send_email'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	const email = removeUnsafeCharsOneLine(req.body.email);

	const isTaken = User.isEmailTaken(email);
	if (isTaken) {
		CRApi.sendError(res, 'EMAIL_TAKEN');
		return;
	}

	const user = await User.createUser(email);

	if (req.body.send_email) {
		const activationURL = user.getActivationURL();
		await CRMail.renderSendMail('new_account', {
			activation_link: activationURL
		}, {
			to: email
		});
	}

	CRApi.sendResponse(res, {
		uid: user.id,
		activation_key: user.activationKey
	});
}

async function toggleEnabled (req, res, next) {
	/**
	 * POST /toggle_enabled
	 * Toggles the enabled state of a user
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Permissions required:
	 * users.modify
	 *
	 * Parameters:
	 * user_id (number)
	 *
	 * Throws:
	 * USER_NOT_FOUND
	 */
	
	if (!await req.user.hasPermission('users.modify')) {
		CRApi.sendError(res, 'MISSING_PERMISSION');
		return;
	}

	const fields = [
		'user_id'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		CRApi.sendError(res, 'USER_NOT_FOUND');
		return;
	}

	user.toggleEnabled();

	CRApi.sendResponse(res);
}

async function initialSetup (req, res, next) {
	/**
	 * POST /initial_setup
	 * Performs the initial profile setup procedure
	 *
	 * Login required
	 * Initial setup not allowed
	 *
	 * Parameters:
	 * full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 *                                    Length: 1-80
	 * [full_name_native]   (string)      The user's full name written in the native writing system in the native order
	 *                                    Length: 1-80
	 * full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 *                                    Length: 1-80
	 * nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 *                                    Length: 1-80
	 * [pet_name]           (string)      (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 *                                    Length: 1-80
	 * pronouns             (string|null) The user's pronouns (li, ri, ŝi) in csv format. If null the user's nickname is used in generated text.
	 *
	 * Throws:
	 * ALREADY_COMPLETED The user has already completed the initial setup
	 */
	
	/** BEGIN INPUT VALIDATION */
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

	let fullNameLatin = removeUnsafeCharsOneLine(req.body.full_name_latin);
	if (fullNameLatin.length < 1 || fullNameLatin.length > 80) {
		CRApi.sendError(res, 'INVALID_ARGUMENT', ['full_name_latin']);
		return;
	}

	let fullNameNative = null;
	if (req.body.full_name_native) {
		fullNameNative = removeUnsafeCharsOneLine(req.body.full_name_native);
		if (fullNameNative.length < 1 || fullNameNative.length > 80) {
			CRApi.sendError(res, 'INVALID_ARGUMENT', ['full_name_native']);
			return;
		}
	}

	let fullNameLatinSort = removeUnsafeCharsOneLine(req.body.full_name_latin_sort);
	if (fullNameLatinSort.length < 1 || fullNameLatinSort.length > 80) {
		CRApi.sendError(res, 'INVALID_ARGUMENT', ['full_name_latin_sort']);
		return;
	}

	let nickname = removeUnsafeCharsOneLine(req.body.nickname);
	if (nickname.length < 1 || nickname.length > 80) {
		CRApi.sendError(res, 'INVALID_ARGUMENT', ['nickname']);
		return;
	}

	let petName = null;
	if (req.body.pet_name) {
		petName = removeUnsafeCharsOneLine(req.body.pet_name);
		if (nickname.length < 1 || nickname.length > 80) {
			CRApi.sendError(res, 'INVALID_ARGUMENT', ['pet_name']);
			return;
		}
	}

	let pronouns = req.body.pronouns;
	if (pronouns !== null) {
		pronouns = pronouns.toString();
		const pronounsArr = pronouns.split(',');
		for (let pronoun of pronounsArr) {
			if (['li','ri','ŝi'].indexOf(pronoun) === -1) {
				CRApi.sendError(res, 'INVALID_ARGUMENT', ['pronouns']);
				return;
			}
		}
	}
	/** END INPUT VAIDATION */

	req.user.initialSetup(fullNameLatin, fullNameNative, fullNameLatinSort, nickname, petName, pronouns);

	CRApi.sendResponse(res);
}
