import User from '../../../api/user';
import Group from '../../../api/group';

async function end_group_memberships (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /end_group_memberships
	 * Sets the to column for a number of group memberships partaining to a user to the current unix time.
	 * If a group in which the user isn't a member is passed it's silently ignored.
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.modify
	 *
	 * Parameters:
	 * user_id (number)   The id of the user
	 * groups  (number[]) The ids of the groups to remove the user from
	 * 
	 * Throws:
	 * USER_NOT_FOUND
	 * GROUP_NOT_FOUND  [group_id]
	 * INVALID_ARGUMENT
	 */

	if (!await req.requirePermissions('users.modify')) { return; }

	const fields = [
		'user_id',
		'groups'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.user_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['user_id']);
		return;
	}

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		res.sendAPIError('USER_NOT_FOUND');
		return;
	}

	if (!(req.body.groups instanceof Array) || req.body.groups.length > 20) {
		res.sendAPIError('INVALID_ARGUMENT', ['groups']);
		return;
	}

	for (let id of req.body.groups) {
		if (!Number.isSafeInteger(id)) {
			res.sendAPIError('INVALID_ARGUMENT', ['groups']);
			return;
		}
	}

	// Get all the groups
	const groups = await Promise.all(req.body.groups.map(id => {
		return Group.getGroupById(id);
	}));

	// Ensure all groups exist
	for (let group of groups) {
		if (group === null) {
			res.sendAPIError('GROUP_NOT_FOUND', [group]);
			return;
		}
	}

	// Remove the user from the groups
	const promises = [];
	for (let group of groups) {
		promises.push(user.endGroupMembership(group));
	}
	await Promise.all(promises);

	res.sendAPIResponse();
}

export default end_group_memberships;
