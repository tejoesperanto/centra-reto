import express from 'express';

import * as CRApi from '..';
import { wrap } from '../..';

import apiClose from './_close';
import apiContribute from './_contribute';
import apiCreate from './_create';
import apiDeleteReminderDirect from './_delete_reminder_direct';
import apiDeleteReminderList from './_delete_reminder_list';
import apiGetContributions from './_get_contributions';
import apiGetGroups from './_get_groups';
import apiGetOwnContributions from './_get_own_contributions';
import apiGetRemindersDirect from './_get_reminders_direct';
import apiGetRemindersLists from './_get_reminders_lists';
import apiInsertReminderDirect from './_insert_reminder_direct';
import apiInsertReminderList from './_insert_reminder_list';
import apiList from './_list';
import apiOpen from './_open';
import apiPublish from './_publish';
import apiRemindersDisable from './_reminders_disable';
import apiRemindersEnable from './_reminders_enable';
import apiRename from './_rename';
import apiSendReminderDirect from './_send_reminder_direct';
import apiSetPublishMessage from './_set_publish_message';
import apiUpdateDeadline from './_update_deadline';
import apiUpdateGroups from './_update_groups';
import apiUpdateNote from './_update_note';
import apiUpdateReminderDirect from './_update_reminder_direct';
import apiUpdateReminderList from './_update_reminder_list';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export default function () {
	const router = express.Router();

	const middleware = CRApi.middleware;

	router.post('/close',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiClose));

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

	router.post('/get_contributions',
		middleware.requireInitialSetup,
		wrap(apiGetContributions));

	router.post('/get_groups',
		middleware.requireInitialSetup,
		wrap(apiGetGroups));

	router.post('/get_own_contributions',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiGetOwnContributions));

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

	router.post('/open',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiOpen));

	router.post('/publish',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiPublish));

	router.post('/reminders_disable',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiRemindersDisable));

	router.post('/reminders_enable',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiRemindersEnable));

	router.post('/rename',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiRename));

	router.post('/send_reminder_direct',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiSendReminderDirect));

	router.post('/set_publish_message',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiSetPublishMessage));

	router.post('/update_deadline',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateDeadline));

	router.post('/update_groups',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateGroups));

	router.post('/update_note',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(apiUpdateNote));

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
