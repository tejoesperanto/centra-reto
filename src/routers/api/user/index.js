import express from 'express';
import multer from 'multer';
import os from 'os';

import * as CRApi from '..';
import { wrap } from '../..';

import apiActivate from './_activate';
import apiAddGroups from './_add_groups';
import apiChangeEmail from './_change_email';
import apiChangeEmailAdmin from './_change_email_admin';
import apiChangePassword from './_change_password';
import apiCreate from './_create';
import apiDeleteUninitiated from './_delete_uninitiated';
import apiEndGroupMemberships from './_end_group_memberships';
import apiGetGroups from './_get_groups';
import apiInitialSetup from './_initial_setup';
import apiList from './_list';
import apiListPublic from './_list_public';
import apiLogin from './_login';
import apiLogout from './_logout';
import apiRemoveProfilePicture from './_remove_profile_picture';
import apiResendActivationMail from './_resend_activation_mail.js';
import apiResetPasswordEmail from './_reset_password_email';
import apiResetPasswordKey from './_reset_password_key';
import apiSetProfilePicture from './_set_profile_picture';
import apiToggleEnabled from './_toggle_enabled';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.post('/activate',
		wrap(apiActivate));

	router.post('/add_groups',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiAddGroups));

	router.post('/change_email',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiChangeEmail));

	router.post('/change_email_admin',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiChangeEmailAdmin));

	router.post('/change_password',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiChangePassword))

	router.post('/create',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiCreate));

	router.post('/delete_uninitiated',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiDeleteUninitiated));

	router.post('/end_group_memberships',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiEndGroupMemberships));

	router.post('/get_groups',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiGetGroups));

	router.post('/initial_setup',
		middleware.requireLogin,
		wrap(apiInitialSetup));

	router.post('/list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiList));

	router.post('/list_public',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiListPublic));

	router.post('/login',
		CR.loginLimiter,
		wrap(apiLogin));

	router.post('/logout',
		wrap(apiLogout));

	router.post('/remove_profile_picture',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiRemoveProfilePicture));

	router.post('/resend_activation_mail',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiResendActivationMail));

	router.post('/reset_password_email',
		wrap(apiResetPasswordEmail));

	router.post('/reset_password_key',
		wrap(apiResetPasswordKey))

	router.post('/set_profile_picture',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		multer({ dest: os.tmpdir(), limits: { fieldSize: '3MB' } }).single('picture'),
		middleware.handleMultipart,
		wrap(apiSetProfilePicture));

	router.post('/toggle_enabled',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiToggleEnabled));

	return router;
}
