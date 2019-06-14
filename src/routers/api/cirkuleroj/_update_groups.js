import Group from '../../../api/group';

async function update_groups (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /update_groups
	 * Updates groups for the general cirkulero settings
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Arguments:
	 * contribute  (number[]) An array of group ids
	 * appear      (number[]) An array of group ids
	 * statistics  (number[]) An array of group ids
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * GROUP_NOT_FOUND  [id]       If a group id does not exist
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const purposes = [
		'contribute',
		'appear',
		'statistics'
	];
	const fields = Object.assign([], purposes);
	if (!req.handleRequiredFields(fields)) { return; }

	// Ensure all the groups exist
	const allGroupIds = [];
	for (let purpose of purposes) {
		if (!(req.body[purpose] instanceof Array)) {
			res.sendAPIError('INVALID_ARGUMENT', [purpose]);
			return;
		}
		for (let groupId of req.body[purpose]) {
			if (!Number.isSafeInteger(groupId)) {
				res.sendAPIError('INVALID_ARGUMENT', [purpose]);
				return;
			}
			allGroupIds.push(groupId);
		}
	}

	const groups = await Promise.all(allGroupIds.map(groupId => {
		return Group.getGroupById(groupId);
	}));

	for (let i = 0; i < groups.length; i ++) {
		const group = groups[i];
		const groupId = allGroupIds[i];
		if (group === null) {
			res.sendAPIError('GROUP_NOT_FOUND', [groupId]);
			return;
		}
	}

	// Update the groups
	const stmt = CR.db.cirkuleroj.prepare('update `groups` set `groups` = @groups where `purpose` = @purpose');
	const data = purposes.map(purpose => {
		return {
			purpose: purpose.toUpperCase(),
			groups: req.body[purpose].join(',')
		};
	});
	for (let entry of data) {
		stmt.run(entry);
	}

	res.sendAPIResponse();
}

export default update_groups;
