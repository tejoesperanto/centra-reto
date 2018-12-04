import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import pageGetRemindersDirect from './_get_reminders_direct';
import pageGetRemindersLists from './_get_reminders_lists';
import pageUpdateReminderDirect from './_update_reminder_direct';
import pageUpdateReminderList from './_update_reminder_list';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.post('/get_reminders_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageGetRemindersDirect));

	router.post('/get_reminders_lists',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageGetRemindersLists));

	router.post('/update_reminder_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageUpdateReminderDirect));

	router.post('/update_reminder_list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageUpdateReminderList));

	return router;
}
