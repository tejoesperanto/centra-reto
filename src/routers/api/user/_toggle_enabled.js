import User from '../../../api/user';

async function user_toggle_enabled (req, res, next) {
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

	user.toggleEnabled();

	res.sendAPIResponse();
}

export default user_toggle_enabled;
