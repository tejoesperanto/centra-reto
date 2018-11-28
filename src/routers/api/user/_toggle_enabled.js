import * as CRApi from '..';
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
	 */
	
	if (!await req.user.hasPermission('users.modify')) {
		CRApi.sendError(res, 'MISSING_PERMISSION');
		return;
	}

	const fields = [
		'user_id'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	const user = User.getUserById(req.body.user_id);
	if (!user) {
		CRApi.sendError(res, 'USER_NOT_FOUND');
		return;
	}

	user.toggleEnabled();

	CRApi.sendResponse(res);
}

export default user_toggle_enabled;
