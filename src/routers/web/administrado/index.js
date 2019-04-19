import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageUzantoj from './_uzantoj';
import pageResursoj from './_resursoj';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();
	router.use(middleware.requireInitialSetup);

    router.get('/resursoj',
        middleware.requireLogin,
        wrap(pageResursoj));

	router.get('/uzantoj',
		middleware.requireLogin,
		wrap(pageUzantoj));

	return router;
}
