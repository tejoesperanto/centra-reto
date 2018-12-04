import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageAgordoj from './_agordoj.js'
import pageArkivo from './_arkivo.js'

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();
	router.use(middleware.requireInitialSetup);

	router.get('/agordoj',
		middleware.requireLogin,
		wrap(pageAgordoj));

	router.get('/arkivo',
		wrap(pageArkivo));

	return router;
}
