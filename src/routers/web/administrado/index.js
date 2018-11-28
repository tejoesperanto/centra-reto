import express from 'express';

import * as CRWeb from '..';
import { wrap } from '../..';

import pageUzantoj from './_uzantoj';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRWeb.middleware;

	router.get('/uzantoj',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageUzantoj));

	return router;
}
