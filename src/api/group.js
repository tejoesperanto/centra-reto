import { promisify } from 'util';
import moment from 'moment-timezone';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

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

	async getNameForUser (user) {
		if (!this.nameDisplay) {
			return this.nameBase;
		}

		let stmt = CR.db.users.prepare('select args from users_groups where group_id = ? and user_id = ?');
		const argsUserStr = stmt.get(this.id, user.id)[0].args || '';
		const argsArr = await csvParse(argsStr);
		const argsUser = argsArr[0]; // We're only interested in the first line

		let name = this.nameDisplay;
		for (let i = 0; i < argsUser.length; i++) {
			const key = '$' + (i + 1);
			name = name.replace(key, args[i]);
		}

		return name;
	}

	getValidityForUser (user) {
		let stmt = CR.db.users.prepare('select `from`, `to` from users_groups where group_id = ? and user_id = ?');
		let row = stmt.get(this.id, user.id);

		const timeNow = moment().unix();
		let active = true;
		if (row.to   && row.to   < timeNow) { active = false; }
		if (            row.from > timeNow) { active = false; }

		return {
			timeFrom: row.from,
			timeTo: row.to,
			active: active
		};
	}

	isDirectForUser (user) {
		let stmt = CR.db.users.prepare('select 1 from users_groups where group_id = ? and user_id = ?');
		let row = stmt.get(this.id, user.id);
		return !!row; // Return whether a row was found
	}

	addUser (user, args, timeFrom, timeTo) {
		const stmt = CR.db.users.prepare("insert into users_groups (user_id, group_id, args, `from`, `to`) values (?, ?, ?, ?, ?)");
		stmt.run(user.id, this.id, args, timeFrom, timeTo);
	}

	static getById (id) {
		let stmt = CR.db.users.prepare('select name_base, name_display, `members_allowed`, `parent`, `public`, searchable, args from groups where id = ?');
		let row = stmt.get(id);

		return new Group({
			id: id,
			nameBase: row.name_base,
			nameDisplay: row.name_display,
			membersAllowed: !!row.membersAllowed,
			parent: row.parent,
			isPublic: !!row.public,
			searchable: !!row.searchable,
			args: row.args
		});
	}
}
