import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiCreate from './_create';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.post('/create',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiCreate));

	return router;
}
