import moment from 'moment-timezone';

import User from '../../../api/user';
import Group from '../../../api/group';

async function add_groups (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /add_groups
	 * Adds a user to a number of groups
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.modify
	 *
	 * Parameters:
	 * user_id (number)   The id of the user
	 * groups  (Object[]) The groups to add the user to. Of format `{ id (number), [args] (string[]), from (number), to (number) }`.
	 *                    May not contain more than 20 entries.
	 *                    id is the group's id
	 *                    args is an array of the user's role formatting arguments. Max length: 50 chars/string
	 *                    from is the time from which the group membership is valid, must be a unix time or null to default to the current time
	 *                    to is the time until which the group membership is valid, must be a unix time or null for it to never expire
	 *
	 * Throws:
	 * USER_NOT_FOUND
	 * GROUP_NOT_FOUND  [group_id]
	 * INVALID_ARGUMENT [argument]
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

	if (typeof req.body.groups !== 'object' || Object.keys(req.body.groups).length > 20) {
		res.sendAPIError('INVALID_ARGUMENT', ['groups']);
		return;
	}
	const groupsInput = req.body.groups;

	const groupIds = [];
	for (let group of groupsInput) {
		if (!('id' in group &&
			Number.isSafeInteger(group.id) &&
			'from' in group &&
			(Number.isSafeInteger(group.from) || group.from === null) &&
			'to' in group &&
			(Number.isSafeInteger(group.to) || group.to === null))) {
			
			res.sendAPIError('INVALID_ARGUMENT', ['groups']);
			return;
		}
		groupIds.push(group.id);

		if (group.from === null) { group.from = moment().unix(); }

		if ('args' in group) {
			if (!(group.args instanceof Array)) {
				res.sendAPIError('INVALID_ARGUMENT', ['groups']);
				return;
			}

			for (let arg of group.args) {
				if (typeof arg !== 'string' || arg.length > 50) {
					res.sendAPIError('INVALID_ARGUMENT', ['groups']);
					return;
				}
			}
		}
	}

	// Get all the groups
	const groups = await Promise.all(groupsInput.map(groupInput => {
		return Group.getGroupById(groupInput.id);
	}));

	// Ensure all groups exist
	for (let i = 0; i < groups.length; i ++) {
		const group = groups[i];
		const groupInput = groupsInput[i];
		if (group === null) {
			res.sendAPIError('GROUP_NOT_FOUND', [groupInput]);
			return;
		}
	}

	// Add the user to the groups
	const addPromises = [];
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const groupInput = groupsInput[i];
		addPromises.push(user.addToGroup(group, groupInput.args, groupInput.from, groupInput.to));
	}
	await Promise.all(addPromises);

	res.sendAPIResponse();
}

export default add_groups;
