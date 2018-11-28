import express from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';

import * as CRApi from '..';
import { wrap } from '../..';

import apiActivate from './_activate';
import apiCreate from './_create';
import apiInitialSetup from './_initial_setup';
import apiList from './_list';
import apiLogin from './_login';
import apiLogout from './_logout';
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

	router.post('/create',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiCreate));

	router.post('/initial_setup',
		middleware.requireLogin,
		wrap(apiInitialSetup));

	router.post('/list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiList));

	router.post('/login',
		CR.loginLimiter,
		wrap(apiLogin));

	router.post('/logout',
		wrap(apiLogout));

	router.post('/toggle_enabled',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiToggleEnabled));

	return router;
}
