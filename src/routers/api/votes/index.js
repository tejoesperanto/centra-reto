import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiCreate from './_create';
import apiDelete from './_delete';
import apiExtend from './_extend';
import apiVote from './_vote';

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

	router.post('/delete',
		wrap(apiDelete));

	router.post('/extend',
		wrap(apiExtend));

	router.post('/vote',
		wrap(apiVote));

	return router;
}
