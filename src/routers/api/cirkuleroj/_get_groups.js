async function get_groups (req, res, next) {
	/**
	 * POST /get_groups
	 * Gets all groups for the general cirkulero settings
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Returns:
	 * contribute  (number[]) An array of group ids
	 * appear      (number[]) An array of group ids
	 * statistics  (number[]) An array of group ids
	 * responsible (number[]) An array of group ids
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const stmt = CR.db.cirkuleroj.prepare('select `purpose`, `groups` from groups');
	const rows = stmt.all()

	const allowedFields = [ 'contribute', 'appear', 'statistics', 'responsible' ];
	const response = {};
	for (let row of rows) {
		const purpose = row.purpose.toLowerCase();
		if (allowedFields.indexOf(purpose) === -1) { continue; }
		const groups = row.groups.split(',').map(x => parseInt(x, 10));
		response[purpose] = groups;
	}

	res.sendAPIResponse(response);
}

export default get_groups;
