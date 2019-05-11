import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageListo from './_listo.js';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();
	router.use(middleware.requireInitialSetup);

	router.get('/',
		wrap(pageListo));

	return router;
}
