import { promisify } from 'util';
import moment from 'moment-timezone';
import _csvStringify from 'csv-stringify';
const csvStringify = promisify(_csvStringify);

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
		this.id = id;
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
	 * @param  {User}        user
	 * @param  {string[]}    [args]   An array of name arguments for use with the group's display name (if it accepts arguments)
	 * @param  {number}      timeFrom The time at which the user's membership became valid
	 * @param  {number|null} [timeTo] The time at which the user's membership becomes invalid
	 * @return {boolean} Whether the user was added to the group. Only returns false if the group does not allowed members.
	 */
	async addUser (user, args = [], timeFrom, timeTo = null) {
		if (!this.membersAllowed) { return false; }

		const argsStr = (await csvStringify([args])).trim();

		const stmt = CR.db.users.prepare("insert into users_groups (user_id, group_id, args, `from`, `to`) values (?, ?, ?, ?, ?)");
		stmt.run(user.id, this.id, argsStr, timeFrom, timeTo);
		return true;
	}

	/**
	 * Obtains a group based on its id
	 * @param  {number} id
	 * @return {Group|null} The group or null if not found.
	 */
	static getGroupById (id) {
		let stmt = CR.db.users.prepare('select name_base, name_display, `members_allowed`, `parent`, `public`, searchable, args from groups where id = ?');
		let row = stmt.get(id);

		if (!row) { return null; }

		return new Group({
			id: id,
			nameBase: row.name_base,
			nameDisplay: row.name_display,
			membersAllowed: !!row.members_allowed,
			parent: row.parent,
			isPublic: !!row.public,
			searchable: !!row.searchable,
			args: row.args
		});
	}

	/**
	 * Obtains a Map of all groups
	 * @return {Map<number>{Group}}
	 */
	static getAllGroups () {
		const stmt = CR.db.users.prepare('select id, name_base, name_display, `members_allowed`, `parent`, `public`, searchable, args from groups');
		const rows = stmt.all();

		const groups = new Map();
		for (let row of rows) {
			const group = new Group({
				id: row.id,
				nameBase: row.name_base,
				nameDisplay: row.name_display,
				membersAllowed: !!row.members_allowed,
				parent: row.parent,
				isPublic: !!row.public,
				searchable: !!row.searchable,
				args: row.args
			});
			groups.set(row.id, group);
		}
		return groups;
	}
}
