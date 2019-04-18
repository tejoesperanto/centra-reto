import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiCreate from './_create';
import apiDelete from './_delete';
import apiList from './_list';
import apiUpdateName from './_update_name';
import apiUpdateDescription from './_update_description';
import apiUpdateUrl from './_update_url';

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

	router.post('/delete',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiDelete));

	router.post('/list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiList));

	router.post('/update_name',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateName));

	router.post('/update_description',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateDescription));

	router.post('/update_url',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateUrl));

	return router;
}
