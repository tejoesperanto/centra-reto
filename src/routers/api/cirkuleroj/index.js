import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiContribute from './_contribute';
import apiCreate from './_create';
import apiDeleteReminderDirect from './_delete_reminder_direct';
import apiDeleteReminderList from './_delete_reminder_list';
import apiGetGroups from './_get_groups';
import apiGetRemindersDirect from './_get_reminders_direct';
import apiGetRemindersLists from './_get_reminders_lists';
import apiInsertReminderDirect from './_insert_reminder_direct';
import apiInsertReminderList from './_insert_reminder_list';
import apiList from './_list';
import apiUpdateGroups from './_update_groups';
import apiUpdateReminderDirect from './_update_reminder_direct';
import apiUpdateReminderList from './_update_reminder_list';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.post('/contribute',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiContribute));

	router.post('/create',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiCreate));

	router.post('/delete_reminder_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiDeleteReminderDirect));

	router.post('/delete_reminder_list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiDeleteReminderList));

	router.post('/get_groups',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiGetGroups));

	router.post('/get_reminders_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiGetRemindersDirect));

	router.post('/get_reminders_lists',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiGetRemindersLists));

	router.post('/insert_reminder_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiInsertReminderDirect));

	router.post('/insert_reminder_list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiInsertReminderList));

	router.post('/list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiList));

	router.post('/update_groups',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateGroups));

	router.post('/update_reminder_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateReminderDirect));

	router.post('/update_reminder_list',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateReminderList));

	return router;
}
