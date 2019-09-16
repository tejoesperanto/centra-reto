import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageEksterreta from './_eksterreta';
import pageRetaj from './_retaj';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();
	router.use(middleware.requireInitialSetup);

	router.get('/eksterreta',
		wrap(pageEksterreta));

	router.get('/retaj',
		middleware.requireLogin,
		wrap(pageRetaj));


	return router;
}
