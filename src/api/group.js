import { promisify } from 'util';
import moment from 'moment-timezone';
import _csvStringify from 'csv-stringify';
const csvStringify = promisify(_csvStringify);
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import User from './user';

/**
 * Represents a group in CR
 */
export default class Group {
	constructor ({
		id = undefined,
		nameBase = undefined,
		nameDisplay = null,
		membersAllowed = undefined,
		parent = null,
		isPublic = undefined,
		searchable = undefined,
		args = null
	} = {}) {
		this.id = parseInt(id, 10);
		this.nameBase = nameBase;
		this.nameDisplay = nameDisplay;
		this.membersAllowed = membersAllowed;
		this.parent = parent;
		this.public = isPublic;
		this.searchable = searchable;
		this.args = args;
	}

	/**
	 * Adds a user to the group
	 * @param  {User}          user
	 * @param  {string[]|null} [args]   An array of name arguments for use with the group's display name (if it accepts arguments)
	 * @param  {number}        timeFrom The time at which the user's membership became valid
	 * @param  {number|null}   [timeTo] The time at which the user's membership becomes invalid
	 * @return {boolean} Whether the user was added to the group. Only returns false if the group does not allowed members.
	 */
	async addUser (user, args = [], timeFrom, timeTo = null) {
		if (!this.membersAllowed) { return false; }

		if (args === null) { args = []; }
		let argsStr = (await csvStringify([args])).trim();
		if (argsStr.length === 0) {
			argsStr = null;
		}

		// If the user is already in the group we'll replace the entry
		const stmt = CR.db.users.prepare("insert or replace into users_groups (user_id, group_id, args, `from`, `to`) values (?, ?, ?, ?, ?)");
		stmt.run(user.id, this.id, argsStr, timeFrom, timeTo);
		return true;
	}

	/**
	 * Obtains a group based on its id
	 * @param  {number} id
	 * @return {Group|null} The group or null if not found.
	 */
	static async getGroupById (id) {
		let stmt = CR.db.users.prepare('select name_base, name_display, `members_allowed`, `parent`, `public`, searchable, args from groups where id = ?');
		let row = stmt.get(id);

		if (!row) { return null; }

		const argsStr = row.args || '';
		let argsArr = await csvParse(argsStr);
		if (argsArr.length > 0) { argsArr = argsArr[0]; }

		return new Group({
			id: +id,
			nameBase: row.name_base,
			nameDisplay: row.name_display,
			membersAllowed: !!row.members_allowed,
			parent: row.parent,
			isPublic: !!row.public,
			searchable: !!row.searchable,
			args: argsArr
		});
	}

	/**
	 * Obtains a Map of all groups
	 * @return {Map<number>{Group}}
	 */
	static async getAllGroups () {
		const stmt = CR.db.users.prepare('select id, name_base, name_display, `members_allowed`, `parent`, `public`, searchable, args from groups');
		const rows = stmt.all();

		const groups = new Map();
		for (let row of rows) {
			const argsStr = row.args || '';
			let argsArr = await csvParse(argsStr);
			if (argsArr.length > 0) { argsArr = argsArr[0]; }

			const group = new Group({
				id: row.id,
				nameBase: row.name_base,
				nameDisplay: row.name_display,
				membersAllowed: !!row.members_allowed,
				parent: row.parent,
				isPublic: !!row.public,
				searchable: !!row.searchable,
				args: argsArr
			});
			groups.set(row.id, group);
		}
		return groups;
	}

	/**
	 * Obtains the group with its user data for a specific user
	 * @param  {User} user
	 * @return {Object|null} Returns null if the user isn't a member of the group
	 */
	async getForUser (user) {
		const groups = await user.getGroups();
		if (!groups.has(this.id)) { return null; }
		return groups.get(this.id);
	}

	/**
	 * Gets all child groups of the group
	 * @return {Group[]}
	 */
	async getAllChildGroups () {
		const groups = [];

		const stmt = CR.db.users.prepare(`select id from groups where parent = ?`);
		const rows = stmt.all(this.id);

		if (rows.length === 0) { return []; }
		const promises = rows.map(row => Group.getGroupById(row.id));
		const directChildren = await Promise.all(promises);
		const indirectChildren = await Promise.all(groups.map(group => group.getAllChildGroups()));
		groups.push(...directChildren, ...indirectChildren);
		return groups;
	}

	/**
	 * Gets all users that directly or indirectly are members of this group
	 * @param  {boolean} [noDuplicates] If true no duplicate users are returned. Defaults to false
	 * @return {User[]}
	 */
	async getAllUsers (noDuplicates = false) {
		// Obtain all the group's children
		const groups = [ this ];
		const getChildren = async ids => {
			const params = '?,'.repeat(ids.length).slice(0, -1);
			const stmt = CR.db.users.prepare(`select id from groups where parent in (${params})`);
			const rows = stmt.all(...ids);

			if (rows.length === 0) { return; }
			const promises = rows.map(row => Group.getGroupById(row.id)); // No await on purpose
			const newGroups = await Promise.all(promises);
			groups.push(...newGroups);
			await getChildren(rows.map(row => row.id));
		};
		await getChildren([ this.id ]);

		// Obtain all users in the group and all of its children
		const params = '?,'.repeat(groups.length).slice(0, -1);
		const stmt = CR.db.users.prepare(`select user_id, email, password, activation_key, activation_key_time from users_groups inner join users on users_groups.user_id = users.id where group_id in (${params}) and enabled = 1 and \`from\` <= @current_time and (\`to\` is null or \`to\` > @current_time)`);
		const rows = stmt.all(...groups.map(x => x.id), {
			current_time: moment().unix()
		});

		const users = [];
		const userIds = [];
		for (let row of rows) {
			if (noDuplicates && userIds.indexOf(row.user_id) !== -1) { continue; }
			const user = new User(row.user_id, row.email, true, row.password);
			user.activationKey = row.activation_key;
			user.activationKeyTime = row.activation_key_time;
			users.push(user);
			userIds.push(user.id);
		}

		return users;
	}
}
