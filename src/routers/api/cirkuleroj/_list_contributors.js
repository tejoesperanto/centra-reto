import * as cirkulero from '../../../api/cirkulero';

async function list_contributors (req, res, next) {
	/**
	 * POST /list_contributors
	 * Lists which users have contributed to a given cirkulero and which have not
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number)
	 *
	 * Returns:
	 *   groups (Object[])
	 *     id    (string|null) The id of the group or null if this is the “remainder” group
	 *     name  (string|null) The name of the group or null if this is the “remainder” group
	 *     users (Object[])
	 *       id         (number) The id of the user
	 *       long_name  (string) The long name of the user
	 *       group_name (string) The user's formatted group name
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	const cirkGroups = await cirkulero.getGroups();
	const children = await Promise.all(cirkGroups.contribute.map(group => group.getAllChildGroups()));
	const groups = cirkGroups.contribute.concat(...children);

	// Get all users allowed to contribute
	const groupUsersMap = await Promise.all(groups.map(async group => {
		const users = await group.getAllUsers();
		
		const usersSettings = await Promise.all(users.map(async user => {
			const settings = await group.getForUser(user);
			return {
				id: user.id,
				long_name: user.getLongName(),
				group_name: settings.user.name
			};
		}));

		return {
			group: {
				id: group.id,
				name: group.nameBase
			},
			users: usersSettings
		};
	}));

	res.sendAPIResponse({
		groups: groupUsersMap
	});
}

export default list_contributors;
