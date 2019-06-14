async function remove_profile_picture (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /remove_profile_picture
	 * Removes the user's profile picture
	 * 
	 * Login required
	 * Initial setup required
	 */

	const stmt = CR.db.users.prepare('delete from users_pictures where user_id = ?');
	stmt.run(req.user.id);

	res.sendAPIResponse();
}

export default remove_profile_picture;
