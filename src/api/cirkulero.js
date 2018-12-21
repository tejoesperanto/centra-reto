import moment from 'moment-timezone';
import url from 'url';

import Group from './group';
import * as CRMail from '../mail';
import { promiseAllObject, escapeHTML } from '../util';

/**
 * Returns all groups a user belongs to that relate to cirkuleroj
 * @param  {User} user
 * @return {Object} A map of `{ purpose string, groups Object (group Group, user Object) }`
 */
export async function getUserCirkuleroGroups (user) {
	const stmt = CR.db.cirkuleroj.prepare('select purpose, groups from groups');
	const rows = stmt.all();

	const userGroups = await user.getGroups();

	const cirkuleroGroups = {};
	for (let row of rows) {
		const purpose = row.purpose.toLowerCase();
		const groupIds = row.groups.split(',').map(x => parseInt(x, 10));

		cirkuleroGroups[purpose] = [];
		for (let id of groupIds) {
			if (!userGroups.has(id)) { continue; }
			if (!userGroups.get(id).user.active) { continue; }

			cirkuleroGroups[purpose].push(userGroups.get(id));
		}
	}

	return cirkuleroGroups;
}

/**
 * Returns the groups to credit contributions to cirkuleroj to
 * @param  {User} user
 * @return {Object[]} (group Group, user Object)
 */
export async function getUserCirkuleroContributionGroups (user) {
	const userGroups = await user.getGroups();
	const creditGroups = [];
	const handleGroups = groups => {
		let nextLookup = [];
		for (let group of groups) {
			if (!group.user.active) { continue; }
			if (group.user.direct) {
				creditGroups.push(group);
			} else {
				const children = group.user.children.map(x => userGroups.get(x));
				nextLookup = nextLookup.concat(children);
			}
		}
		if (!nextLookup.length) { return; }
		handleGroups(nextLookup);
	};
	const groups = (await getUserCirkuleroGroups(user)).contribute;
	handleGroups(groups);
	return creditGroups;
}

/**
 * Returns whether the user may contribute to cirkuleroj
 * @param  {User} user
 * @return {boolean}
 */
export async function mayUserContributeToCirkuleroj (user) {
	const cirkuleroGroups = await getUserCirkuleroGroups(user);
	return cirkuleroGroups.contribute.length > 0;
}

/**
 * Obtains all the groups related to cirkuleroj
 * @param  {boolean} [withChildren] Whether to include the groups' children
 * @return {Object} A map of `{ purpose string: groups Group[] }`
 */
export async function getGroups (withChildren = false) {
	const stmt = CR.db.cirkuleroj.prepare('select purpose, groups from groups');
	const rows = stmt.all();

	const groups = {};
	for (let row of rows) {
		const groupIds = row.groups.split(',');
		groups[row.purpose.toLowerCase()] = await Promise.all(groupIds.map(async id => {
			const group = await Group.getGroupById(id);
			if (withChildren) {
				await group.getAllChildGroups();
			}
			return group;
		}));
	};

	return groups;
}

/**
 * Obtains all the allowed contributors to cirkuleroj
 * @return {User[]}
 */
export async function getAllowedContributors () {
	const contributorGroups = (await getGroups()).contribute;
	const userArrs = await Promise.all(contributorGroups.map(group => group.getAllUsers(true)));
	const usersRaw = [].concat(...userArrs);
	const users = [];
	const userIds = [];
	for (let user of usersRaw) {
		if (userIds.indexOf(user.id) > -1) { continue; }
		userIds.push(user.id);
		users.push(user);
	}
	return users;
}

/**
 * Gets all contributions to a cirkulero
 * @param  {number} id The id of the cirkulero
 * @return {Object[]}
 */
export function getAllContributions (id) {
	const stmt = CR.db.cirkuleroj.prepare('select user_id, group_id, user_role_comment, faris, faras, faros, comment, modified_by_admin from cirkuleroj_contributions where cirkulero_id = ?');
	const rows = stmt.all(id);
	return rows;
}

/**
 * Gets all the user's who haven't contributed to a cirkulero
 * @param  {number} id The id of the cirkulero
 * @return {Object} A map of {id (number): user (User)}
 */
export async function getAllNonContributors (id) {
	const stmt = CR.db.cirkuleroj.prepare('select user_id from cirkuleroj_contributions where cirkulero_id = ?');
	const contributors = stmt.all(id).map(x => x.user_id);

	const cirkGroups = await getGroups();
	const childrenObjPromises = {};
	for (let group of cirkGroups.contribute) {
		childrenObjPromises[group.id] = group.getAllChildGroups();
	}
	const childrenObj = await promiseAllObject(childrenObjPromises);
	const children = [].concat(...Object.values(childrenObj));
	const allGroups = cirkGroups.contribute.concat(children);
	const groups = allGroups.filter(group => group.membersAllowed);
	const usersArrs = await Promise.all(groups.map(group => group.getAllUsers(true)));
	const users = {};
	for (let user of [].concat(...usersArrs)) {
		if (user.id in users) { continue; }
		if (contributors.indexOf(user.id) > -1) { continue; }
		users[user.id] = user;
	}

	return users;
}

/**
 * Checks all cirkuleroj to see if a reminder should be sent out.
 * This function is automatically called by the event loop.
 */
export async function checkReminders () {
	const timeNow = moment().unix();

	let stmt = CR.db.cirkuleroj.prepare('select id, delta_time, message from reminders_direct order by delta_time desc');
	const directReminders = stmt.all();

	stmt = CR.db.cirkuleroj.prepare('select id, delta_time, message, list_email from reminders_lists order by delta_time desc');
	const listReminders = stmt.all();

	stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, note, open from cirkuleroj where reminders = 1 and published = 0');
	const cirkuleroj = stmt.all();

	const mailPromises = [];

	for (let cirk of cirkuleroj) {
		const openCirk = () => {
			if (!cirk.open) {
				const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set open = 1 where id = ?');
				stmt.run(cirk.id);
				cirk.open = 1;
			}
		};

		// List reminders
		stmt = CR.db.cirkuleroj.prepare('select reminder_id from reminders_lists_sent where cirkulero_id = ?')
		const sentListReminders = new Set(stmt.all(cirk.id).map(x => x.reminder_id));

		for (let i = 0; i < listReminders.length; i++) {
			const reminder = listReminders[i];
			// Ensure we haven't already sent the reminder
			if (sentListReminders.has(reminder.id)) { continue; }
			// Check if it's time to send it
			const minTime = cirk.deadline - reminder.delta_time;
			if (minTime > timeNow) { continue; }

			openCirk();

			stmt = CR.db.cirkuleroj.prepare('insert into reminders_lists_sent (reminder_id, cirkulero_id) values (?, ?)');
			stmt.run(reminder.id, cirk.id);

			let msg = reminder.message;
			msg = msg.replace(/{{cirkulero}}/g, `Cirkulero n-ro ${cirk.id} de ${cirk.name}`);
			msg = msg.replace(/{{numero}}/g, cirk.id);
			msg = msg.replace(/{{monato}}/g, cirk.name);
			msg = msg.replace(/{{noto}}/g, cirk.note || '');
			msg = msg.replace(/{{ligilo}}/g, url.resolve(CR.conf.addressPrefix, `cirkuleroj/${cirk.id}`));
			msg = msg.replace(/{{limdato}}/g, moment.unix(cirk.deadline).format(CR.timeFormats.dateTimeFull));

			// Remove consecutive newlines
			msg = msg.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');

			let subject = `Cirkulero ${cirk.id}`;
			if (i > 0) { // This is not the first reminder
				subject += ' – Memorigo';
			}

			mailPromises.push(CRMail.sendMail({
				subject: subject,
				to: reminder.list_email,
				text: msg
			}));
		}

		// Direct reminders
		stmt = CR.db.cirkuleroj.prepare('select reminder_id from reminders_direct_sent where cirkulero_id = ?');
		const sentDirectReminders = new Set(stmt.all(cirk.id).map(x => x.reminder_id));

		const users = await getAllNonContributors(cirk.id);

		for (let reminder of directReminders) {
			// Ensure we haven't already sent the reminder
			if (sentDirectReminders.has(reminder.id)) { continue; }
			// Check if it's time to send it
			const minTime = cirk.deadline - reminder.delta_time;
			if (minTime > timeNow) { continue; }

			openCirk();

			stmt = CR.db.cirkuleroj.prepare('insert into reminders_direct_sent (reminder_id, cirkulero_id) values (?, ?)');
			stmt.run(reminder.id, cirk.id);

			const contribURL = url.resolve(CR.conf.addressPrefix, `cirkuleroj/${cirk.id}`);
			const prettyContribURL = contribURL.replace(/^https?:\/\/?/, '');

			let generalMsg = reminder.message;
			generalMsg = generalMsg.replace(/{{cirkulero}}/g, `Cirkulero n-ro ${cirk.id} de ${cirk.name}`);
			generalMsg = generalMsg.replace(/{{numero}}/g, cirk.id);
			generalMsg = generalMsg.replace(/{{monato}}/g, cirk.name);
			generalMsg = generalMsg.replace(/{{noto}}/g, cirk.note || '');
			generalMsg = generalMsg.replace(/{{limdato}}/g, moment.unix(cirk.deadline).format(CR.timeFormats.dateTimeFull));

			for (let user of Object.values(users)) {
				let name = user.getBriefName();
				if (!name) { name = 'cirkulerkontribuanto'; }

				let userMessage = generalMsg.replace(/{{nomo}}/g, name);

				let htmlMessage = escapeHTML(userMessage);

				userMessage = userMessage.replace(/{{ligilo}}/g, contribURL);
				htmlMessage = htmlMessage.replace(/{{ligilo}}/g, `<a href="${contribURL}">${prettyContribURL}</a>`);

				// Remove consecutive newlines
				userMessage = userMessage.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');
				htmlMessage = htmlMessage.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');

				const paragraphs = htmlMessage.split(/(?:\r?\n){2}/g)
					.map(par => par.split(/\r?\n/g).join('<br>'));

				mailPromises.push(CRMail.renderSendMail('cirkulero_reminder_direct', {
					preheader: `Vi ankoraŭ ne kontribuis al cirkulero ${cirk.id}.`,
					text: userMessage,
					paragraphs: paragraphs
				}, {
					subject: `Cirkulero ${cirk.id} – Vi ankoraŭ ne kontribuis`,
					to: user.email
				}));
			}
		}
	}

	await Promise.all(mailPromises);
}

/**
 * Checks all cirkulero deadlines to see if a message that we're past the deadline should be sent to the responsible person.
 * This function is automatically called by the event loop.
 */
export async function checkDeadlines () {
	const mailPromises = [];

	let stmt = CR.db.cirkuleroj.prepare('select value from settings where key = "responsible_group"');
	const responsibleGroup = await Group.getGroupById(parseInt(stmt.get().value, 10));
	const users = await responsibleGroup.getAllUsers();

	const timeNow = moment().unix();
	stmt = CR.db.cirkuleroj.prepare('select id, name from cirkuleroj c where published = 0 and deadline < ? and not exists ( select 1 from cirkulero_deadline_sent d where d.cirkulero_id = c.id )');
	const cirkuleroj = stmt.all(timeNow);

	const insertStmt = CR.db.cirkuleroj.prepare('insert into cirkulero_deadline_sent (cirkulero_id) values (?)');
	for (let cirkulero of cirkuleroj) {
		insertStmt.run(cirkulero.id);

		stmt = CR.db.cirkuleroj.prepare('select count(1) as count from cirkuleroj_contributions where cirkulero_id = ?');
		const contribs = stmt.get(cirkulero.id).count;

		for (let user of users) {
			mailPromises.push(CRMail.renderSendMail('cirkulero_deadline', {
				preheader: `Cirkulero ${cirkulero.id} atendas vian decidon.`,
				cirk_id: cirkulero.id,
				cirk_name: cirkulero.name,
				name: user.getBriefName(),
				contribs: contribs,
				venontaj_link: url.resolve(CR.conf.addressPrefix, `cirkuleroj/venontaj`),
				pretigi_link: url.resolve(CR.conf.addressPrefix, `cirkuleroj/${cirkulero.id}/pretigi`)
			}, {
				to: user.email,
				subject: `Venis la limdato por cirkulero ${cirkulero.id}`
			}));
		}
	}

	await Promise.all(mailPromises);
}
