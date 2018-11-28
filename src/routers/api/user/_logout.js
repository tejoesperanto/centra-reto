import * as CRApi from '..';

async function user_logout (req, res, next) {
	/**
	 * POST /logout
	 * Logs out
	 *
	 * Login not required
	 * Initial setup not required
	 */
	
	req.logout();

	CRApi.sendResponse(res);
}

export default user_logout;
