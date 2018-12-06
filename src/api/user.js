import { promisify, inspect } from 'util';
import crypto from 'pn/crypto';
import moment from 'moment-timezone';
import url from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import Group from './group';

/**
 * Represents a user in CR
 */
class User {
	constructor (id, email, enabled, password) {
		// The values beneath can be safely accessed at any time
		// For any values not mentioned here, please use its getter function as they're obtained as needed
		this.id = id;
		this.email = email;
		this.enabled = !!enabled;
		this.password = password;

		this.activationKey = null;
		this.activationKeyTime = null;
	}

	/**
	 * Creates a new user
	 * @param  {string} email The user's primary email address
	 * @return {User} The new user
	 */
	static async createUser (email) {
		// Generate activation key
		const activationKeyBytes = await crypto.randomBytes(CR.conf.activationKeySize);
		const activationKey = activationKeyBytes.toString('hex');

		const activationKeyTime = moment().unix();

		const stmt = CR.db.users.prepare("insert into users (email, activation_key, activation_key_time) values (?, ?, ?)");
		const info = stmt.run(email, activationKey, activationKeyTime);

		const user = new User(info.lastInsertRowid, email, true, null);
		user.activationKey = activationKey;
		user.activationKeyTime = activationKeyTime;
		return user;
	}

	/**
	 * Checks whether a primary email address is taken
	 * @param  {string}  email The email address to check
	 * @return {Boolean} Whether the primary email address is taken
	 */
	static isEmailTaken (email) {
		return CR.db.users.prepare("select 1 from users where email = ?").get(email) != undefined;
	}

	/**
	 * Enabled or disables the user
	 * @return {boolean} The new enabled state
	 */
	toggleEnabled () {
		CR.db.users.prepare('update users set enabled = not enabled where id = ?').run(this.id);
		this.enabled = !this.enabled;
		return this.enabled;
	}

	/**
	 * Gets the URL needed to activate the user's account
	 * @return {string} The account activation url
	 */
	getActivationURL () {
		return url.resolve(CR.conf.addressPrefix, path.join('alighi', this.email, this.activationKey));
	}

	/**
	 * Activates a user by setting their activation key to null and applying the provided prehashed password
	 * @param  {string} password The user's password, already hashed
	 */
	activate (password) {
		const stmt = CR.db.users.prepare("update users set password = ?, activation_key = NULL, activation_key_time = NULL where id = ?");
		stmt.run(password, this.id);
		this.activationKey = null;
		this.activationKeyTime = null;
		this.password = password;
	}

	/**
	 * Obtains the user with the provided id, returns null if no user was found
	 * @param  {number} id The user's id
	 * @return {User}      The user instance
	 */
	static getUserById (id) {
		const data = CR.db.users.prepare("select email, enabled, password, activation_key, activation_key_time from users where id = ?")
			.get(id);

		if (!data) {
			return null;
		}

		const user = new User(id, data.email, data.enabled, data.password);
		user.activationKey = data.activation_key;
		user.activationKeyTime = data.activation_key_time;
		return user;
	}

	/**
	 * Obtains the user with the provided email, returns null if no user was found
	 * @param  {string}    id The user's email
	 * @return {User|null}    The user instance
	 */
	static getUserByEmail (email) {
		const data = CR.db.users.prepare("select id, enabled, password, activation_key, activation_key_time from users where email = ?")
			.get(email);

		if (!data) {
			return null;
		}

		const user = new User(data.id, email, data.enabled, data.password);
		user.activationKey = data.activation_key;
		user.activationKeyTime = data.activation_key_time;
		return user;
	}

	/**
	 * Hashes a plaintext password using bcrypt
	 * @param  {string} plaintext The plaintext password
	 * @return {string}           The bcrypt hash
	 */
	static hashPassword (plaintext) {
		return bcrypt.hash(plaintext, CR.conf.bcryptSaltRounds);
	}

	/**
	 * Returns whether the user has completed inital setup
	 * @return {Boolean} Whether the user has completed initial setup
	 */
	hasCompletedInitialSetup () {
		const stmt = CR.db.users.prepare("select 1 from users_details where user_id = ?");
		const row = stmt.get(this.id);
		return !!row;
	}

	/**
	 * Performs initial profile setup for the user
	 * @param  {string}      fullNameLatin     The user's full name written in the latin alphabet in the native order
	 * @param  {string}      fullNameNative    The user's full name written in the native writing system in the native order
	 * @param  {string}      fullNameLatinSort The user's full name written in the latin alphabet in sorted order
	 * @param  {string}      nickname          (alvoknomo) The user's nickname (usually the personal name)
	 * @param  {string}      petName           (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 * @param  {string|null} pronouns          The user's pronouns in csv format. If null the user's nickname is used in generated text.
	 */
	initialSetup (fullNameLatin, fullNameNative, fullNameLatinSort, nickname, petName, pronouns) {
		const stmt = CR.db.users.prepare(`insert into users_details
			(user_id, full_name_latin, full_name_native, full_name_latin_sort, nickname, pet_name, pronouns)
			values (?, ?, ?, ?, ?, ?, ?)`);
		stmt.run(this.id, fullNameLatin, fullNameNative, fullNameLatinSort, nickname, petName, pronouns);

		this.details = {
			fullNameLatin: fullNameLatin,
			fullNameNative: fullNameNative,
			fullNameLatinSort: fullNameLatinSort,
			nickname: nickname,
			petName: petName,
			pronouns: pronouns
		};
	}

	/**
	 * Obtains the user's name details
	 * @return {Object}
	 */
	getNameDetails () {
		if (this.details) {
			return this.details;
		}

		const stmt = CR.db.users.prepare("select full_name_latin, full_name_native, full_name_latin_sort, nickname, pet_name, pronouns from users_details where user_id = ?");
		const row = stmt.get(this.id);

		if (row) {
			this.details = {
				fullNameLatin: row.full_name_latin,
				fullNameNative: row.full_name_native,
				fullNameLatinSort: row.full_name_latin_sort,
				nickname: row.nickname,
				petName: row.pet_name,
				pronouns: row.pronouns
			};

			return this.details;
		} else {
			return {};
		}
	}

	/**
	 * Returns the user's full name with the optional pet name in parenthesis at the end
	 * @return {string}
	 */
	getLongName () {
		const details = this.getNameDetails();
		return User.formatLongName(details.fullNameLatin, details.petName);
	}

	/**
	 * Formats a long name using a full name with the optional pet name in parenthesis at the end
	 * @param  {string}      fullNameLatin The full name written in the latin alphabet in the native order
	 * @param  {string|null} [petName]     (kromnomo) The pet name (used as a nickname that's not part of the full name)
	 * @return {string}
	 */
	static formatLongName (fullNameLatin, petName = null) {
		let name = fullNameLatin;
		if (petName) {
			name += ` ${petName}`
		}
		return name;
	}

	/**
	 * Returns the user's short name with the optional pet name in parenthesis at the end
	 * @return {string}
	 */
	getShortName () {
		const details = this.getNameDetails();
		let name = details.nickname;
		if (details.petName) {
			name += ` (${details.petName})`;
		}
		return name;
	}

	/**
	 * Returns the user's brief name (pet name if present, otherwise nickname)
	 * @return {string}
	 */
	getBriefName () {
		const details = this.getNameDetails();
		if (details.petName) {
			return details.petName;
		} else {
			return details.nickname;
		}
	}

	/**
	 * Gets all the user's groups
	 * @return {Object}
	 */
	async getGroups () {
		if (this.groups) {
			return this.groups;
		}

		this.groups = new Map();

		const timeNow = moment().unix();

		const pairings = {};
		const handleRows = async rows => {
			const nextLookup = [];
			for (let row of rows) {
				let timeFrom = row.from;
				let timeTo = row.to;

				// If already present
				if (this.groups.has(row.id)) {
					const group = this.groups.get(row.id);
					timeFrom = Math.min(timeFrom, group.user.from);
					if (timeTo && group.user.to) {
						timeTo = Math.max(timeTo, group.user.to);
					} else if (group.user.to) {
						timeTo = group.user.to;
					}
				}

				let direct = true;
				if (row.direct === false) { direct = false; }

				// If parent
				if (!direct) {
					const children = pairings[row.id].map(x => this.groups.get(x));
					timeFrom = Math.min(...children.map(x => x.user.from));
					timeTo = Math.max(...children.map(x => {
						if (!x.user.to) { return 0; }
						return x.user.to;
					}));
				}

				let active = true;
				if (          timeFrom > timeNow) { active = false; }
				if (timeTo && timeTo   < timeNow) { active = false; }

				const userArgsStr = row.user_args || '';
				let userArgsArr = await csvParse(userArgsStr);
				if (userArgsArr.length > 0) { userArgsArr = userArgsArr[0]; }

				const groupArgsStr = row.group_args || '';
				let groupArgsArr = await csvParse(groupArgsStr);
				if (groupArgsArr.length > 0) { groupArgsArr = groupArgsArr[0]; }

				let nameForUser = row.name_base;
				if (row.name_display) {
					nameForUser = row.name_display;
					for (let i = 0; i < userArgsArr.length; i++) {
						const key = '$' + (i + 1);
						nameForUser = nameForUser.replace(key, userArgsArr[i]);
					}
				}

				this.groups.set(row.id, {
					group: new Group({
						id: row.id,
						nameBase: row.name_base,
						nameDisplay: row.name_display,
						membersAllowed: !!row.members_allowed,
						parent: row.parent,
						isPublic: !!row.public,
						searchable: !!row.searchable,
						args: groupArgsArr
					}),
					user: {
						args: userArgsArr,
						from: timeFrom,
						to: timeTo,
						active: active,
						direct: direct,
						children: pairings[row.id] || null,
						name: nameForUser
					}
				});

				if (row.parent) {
					nextLookup.push(row.parent);
					if (!pairings[row.parent]) { pairings[row.parent] = []; }
					pairings[row.parent].push(row.id);
				}
			}

			if (nextLookup.length < 1) { return; }

			const params = '?,'.repeat(nextLookup.length).slice(0, -1);
			const stmt = CR.db.users.prepare(`select id, name_base, name_display, \`parent\`, \`public\`, searchable, \`members_allowed\`, \`args\` as group_args from groups where id in (${params})`);
			const newRows = stmt.all(...nextLookup);

			for (let row of newRows) {
				row.direct = false;
			}

			await handleRows(newRows, nextLookup);
		};

		const stmt = CR.db.users.prepare('select groups.id, `from`, `to`, name_base, name_display, `members_allowed`, `parent`, `public`, searchable, groups.`args` as group_args, users_groups.`args` as user_args from users_groups inner join groups on users_groups.group_id = groups.id where user_id = ?');
		const rows = stmt.all(this.id);

		await handleRows(rows);
		return this.groups;
	}

	/**
	 * Ends a user's membership in a group by setting its to column to the current time
	 * @param  {Group|number} group The group or its id
	 * @return {boolean} false if the user isn't in the group, otherwise true
	 */
	async endGroupMembership (group) {
		if (typeof group === 'number') {
			group = await Group.getGroupById(groupId);
		}

		const groups = await this.getGroups();
		if (!groups.has(group.id)) { return false; }

		const timeNow = moment().unix();

		const stmt = CR.db.users.prepare('update users_groups set `to` = ? where user_id = ? and group_id = ?');
		stmt.run(timeNow, this.id, group.id);

		groups.get(group.id).user.to = timeNow;
		groups.get(group.id).user.active = false;

		return true;
	}

	/**
	 * Adds a user to a group
	 * @param  {number|Group}  groupId    The group or its id
	 * @param  {string[]|null} [args]     An array of name arguments for use with the group's display name (if it accepts arguments)
	 * @param  {number}        [timeFrom] The time when the user was added to the group, defaults to now
	 * @param  {number|null}   [timeTo]   The time at which the user's membership expires, defaults to never
	 * @return {Group|boolean} The group the user was added to or false if the group doesn't permit members
	 */
	async addToGroup (group, args = [], timeFrom = undefined, timeTo = null) {
		if (timeFrom === undefined) {
			timeFrom = moment().unix();
		}

		if (typeof group === 'number') {
			group = await Group.getGroupById(groupId);
		}

		if (args === null) { args = []; }

		const wasAdded = await group.addUser(this, args, timeFrom, timeTo);
		if (!wasAdded) { return false; }
		
		const timeNow = moment().unix();
		let active = true;
		if (timeTo && timeTo   < timeNow) { active = false; }
		if (          timeFrom > timeNow) { active = false; }

		let nameForUser = group.nameBase;
		if (group.nameDisplay) {
			nameForUser = group.nameDisplay;
			for (let i = 0; i < args.length; i++) {
				const key = '$' + (i + 1);
				nameForUser = nameForUser.replace(key, args[i]);
			}
		}

		const groups = await this.getGroups();
		groups.set(group.id, {
			group: group,
			user: {
				args: args,
				from: timeFrom,
				to: timeTo,
				active: active,
				direct: true,
				children: null,
				name: nameForUser
			}
		});

		return group;
	}

	/**
	 * Gets all the user's permissions
	 * @return {Object}
	 */
	async getPermissions () {
		if (this.permissions) {
			return this.permissions;
		}

		this.permissions = {};
		const rawPermissions = [];

		// Obtain group permissions
		const groups = await this.getGroups();
		const groupIds = [];
		for (let group of groups.values()) {
			if (group.user.active) {
				groupIds.push(group.group.id);
			}
		}

		const params = '?,'.repeat(groupIds.length).slice(0, -1);
		let stmt = CR.db.users.prepare(`select permission from groups_permissions where group_id in (${params})`);
		let rows = stmt.all(...groupIds);
		for (let row of rows) {
			rawPermissions.push(row.permission);
		}

		// Obtain individual permissions
		stmt = CR.db.users.prepare("select permission from users_permissions where user_id = ?");
		rows = stmt.all(this.id);
		for (let row of rows) {
			rawPermissions.push(row.permission);
		}

		// Structurize the permissions into this.permissions
		for (let permission of rawPermissions) {
			let path = this.permissions;
			const bits = permission.split('.');
			for (let i = 0; i < bits.length; i++) {
				const bit = bits[i];
				const isLast = i + 1 === bits.length;

				if (isLast) {
					path[bit] = true;
				} else {
					if (!(bit in path)) { path[bit] = {}; }
					path = path[bit];
				}
			}
		}

		return this.permissions
	}

	/**
	 * Returns whether the user has a given permission
	 * @param  {string}  permission The permission to check
	 * @return {boolean}
	 */
	async hasPermission (permission) {
		const permissions = await this.getPermissions();

		let path = permissions;
		const bits = permission.split('.');
		for (let bit of bits) {
			if (!(bit in path)) {
				return '*' in path;
			}
			path = path[bit];
		}
		return true;
	}

	/**
	 * Returns all groups the user belongs to that relate to cirkuleroj
	 * @return {Object} A map of `{ purpose string, groups Group[] }`
	 */
	async getCirkuleroGroups () {
		const stmt = CR.db.cirkuleroj.prepare('select purpose, groups from groups');
		const rows = stmt.all();

		const userGroups = await this.getGroups();

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
	 * @return {number[]}
	 */
	async getCirkuleroContributionGroups () {
		const userGroups = await this.getGroups();
		const creditGroups = [];
		const handleGroups = groups => {
			let nextLookup = [];
			for (let group of groups) {
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
		const groups = (await this.getCirkuleroGroups()).contribute;
		handleGroups(groups);
		return creditGroups;
	}

	/**
	 * Returns whether the user may contribute to cirkuleroj
	 * @return {boolean}
	 */
	async mayContributeToCirkuleroj () {
		const cirkuleroGroups = await this.getCirkuleroGroups();
		return cirkuleroGroups.contribute.length > 0;
	}
}

export default User;
