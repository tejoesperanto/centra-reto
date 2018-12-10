import express from 'express';

import { middleware } from '..';
import { wrap } from '../..';

import pageAgordoj from './_agordoj.js';
import pageArkivo from './_arkivo.js';
import pageNumero from './_numero.js';
import pagePretigi from './_pretigi.js';
import pageVenontaj from './_venontaj.js';

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

	router.get('/venontaj',
		middleware.requireLogin,
		wrap(pageVenontaj));

	// These must be added at the very end
	router.get('/:id/pretigi',
		middleware.requireLogin,
		wrap(pagePretigi));

	router.get('/:id',
		wrap(pageNumero));


	return router;
}
