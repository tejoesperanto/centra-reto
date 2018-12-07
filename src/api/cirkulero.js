import Group from './group';

/**
 * Returns all groups a user belongs to that relate to cirkuleroj
 * @param  {User} user
 * @return {Object} A map of `{ purpose string, groups Group[] }`
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
 * @return {Group[]}
 */
export async function getUserCirkuleroContributionGroups (user) {
	const userGroups = await user.getGroups();
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
 * @return {Object} A map of `{ purpose string: groups Group[] }`
 */
export async function getGroups () {
	const stmt = CR.db.cirkuleroj.prepare('select purpose, groups from groups');
	const rows = stmt.all();

	const groups = {};
	for (let row of rows) {
		const groupIds = row.groups.split(',');
		groups[row.purpose] = groupIds.map(id => Group.getGroupById(id));
	};

	return groups;
}
