import User from '../../../api/user';

async function user_toggle_enabled (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /toggle_enabled
	 * Toggles the enabled state of a user
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Permissions required:
	 * users.modify
	 *
	 * Parameters:
	 * user_id (number)
	 *
	 * Throws:
	 * USER_NOT_FOUND
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('users.modify')) { return; }

	const fields = [
		'user_id'
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

	const isEnabled = user.toggleEnabled();

	if (!isEnabled) {
		// End all the user's active memberships
		const groups = await user.getGroups();
		for (let group of groups.values()) {
			if (group.user.to !== null) { continue; }
			user.endGroupMembership(group.group);
		}
	}

	res.sendAPIResponse();
}

export default user_toggle_enabled;
