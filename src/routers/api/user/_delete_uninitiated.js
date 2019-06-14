import User from '../../../api/user';

async function delete_uninitiated (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /delete_uninitiated
	 * Deletes a user that has not yet completed the initial setup
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.delete
	 * 
	 * Parameters:
	 * user_id (number) The user's id
	 *
	 * Throws:
	 * USER_NOT_FOUND              There's no user with the specified id
	 * USER_SET_UP                 The user has already completed the initial set up and cannot be deleted
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('users.delete')) { return; }

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

	if (user.hasCompletedInitialSetup()) {
		res.sendAPIError('USER_SET_UP');
		return;
	}

	CR.db.users.prepare('delete from users where id = ?').run(user.id);
	req.user = null;

	res.sendAPIResponse();
}

export default delete_uninitiated;
