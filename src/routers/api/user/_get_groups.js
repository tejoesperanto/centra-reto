import User from '../../../api/user';

async function get_groups (req, res, next) {
	/**
	 * POST /add_groups
	 * Adds a user to a number of groups
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.view
	 *
	 * Parameters:
	 * user_id (number)   The id of the user
	 *
	 * Returns:
	 * groups (Object[])
	 *   group (Object)
	 *     id              (number)
	 *     name_base       (string)
	 *     name_display    (string|null)
	 *     members_allowed (boolean)
	 *     parent          (number|null)
	 *     public          (boolean)
	 *     searchable      (boolean)
	 *     args            (string[]|null)
	 *   user  (Object)
	 *     args            (string[]|null)
	 *     from            (number)
	 *     to              (number|null)
	 *
	 * Throws:
	 * USER_NOT_FOUND
	 * INVALID_ARGUMENT [argument]
	 */

	 if (!await req.requirePermissions('users.view')) { return; }

	const fields = [
		'user_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.user_id)) {
		res.sendAPIError('INVALID_ARGUMENT', [user_id]);
		return;
	}

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		res.sendAPIError('USER_NOT_FOUND');
		return;
	}

	const groups = await user.getGroups();
	const groupsResponse = [];

	for (let group of groups.values()) {
		groupsResponse.push({
			group: {
				id: group.group.id,
				name_base: group.group.nameBase,
				name_display: group.group.nameDisplay,
				members_allowed: group.group.membersAllowed,
				parent: group.group.parent,
				public: group.group.public,
				searchable: group.group.searchable,
				args: group.group.args
			},
			user: {
				args: group.user.args,
				from: group.user.from,
				to: group.user.to,
				active: group.user.active,
				direct: group.user.direct,
				name: group.user.name
			}
		});
	}

	res.sendAPIResponse({
		groups: groupsResponse
	});
}

export default get_groups;
