import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiCreate from './_create';
import apiExtend from './_extend';
import apiDelete from './_delete';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.use(middleware.requireLogin);
	router.use(middleware.requireInitialSetup);

	router.post('/create',
		wrap(apiCreate));

	router.post('/extend',
		wrap(apiExtend));

	router.post('/delete',
		wrap(apiDelete));

	return router;
}
