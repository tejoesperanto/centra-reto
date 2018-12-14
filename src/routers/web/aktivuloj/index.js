import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageAktivulo from './_aktivulo';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();
	router.use(middleware.requireInitialSetup);

	router.get('/:email',
		wrap(pageAktivulo));


	return router;
}
