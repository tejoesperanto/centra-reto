import * as CRCirkulero from '../../../api/cirkulero';
import Group from '../../../api/group';

async function get_groups (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /get_groups
	 * Gets all groups for the general cirkulero settings
	 *
	 * Login not required
	 * Initial setup required if logged in
	 *
	 * Arguments:
	 * [cirkulero_id] (number) Optionally the id for the cirkulero to obtain the groups for. If not present, obtains the current groups
	 *
	 * Returns:
	 * contribute  (Object[]) A map of { id (number), name (string), children (number[]) }
	 * appear      (Object[]) A map of { id (number), name (string), children (number[]) }
	 * statistics  (Object[]) A map of { id (number), name (string), children (number[]) }
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if ('cirkulero_id' in req.body && !Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (req.body.cirkulero_id !== undefined) {
		const stmt = CR.db.cirkuleroj.prepare('select groups_contribute, groups_appear, groups_statistics from cirkuleroj_published where cirkulero_id = ?');
		const row = stmt.get(req.body.cirkulero_id);
		if (row) {
			const rawGroups = {
				contribute: row.groups_contribute.split(',').map(x => parseInt(x, 10)),
				appear: row.groups_appear.split(',').map(x => parseInt(x, 10)),
				statistics: row.groups_statistics.split(',').map(x => parseInt(x, 10))
			};

			const groups = {};
			for (let purpose in rawGroups) {
				groups[purpose] = await Promise.all(rawGroups[purpose].map(async id => {
					const group = await Group.getGroupById(id);
					return {
						id: id,
						name: group.nameBase,
						children: (await group.getAllChildGroups()).map(x => x.id)
					};
				}));
			}

			res.sendAPIResponse(groups);
			return;
		}
	}

	const groupsRaw = await CRCirkulero.getGroups(true);
	const groups = {};
	for (let purpose in groupsRaw) {
		const purposeGroups = groupsRaw[purpose];
		groups[purpose] = await Promise.all(purposeGroups.map(async group => {
			return {
				id: group.id,
				name: group.nameBase,
				children: (await group.getAllChildGroups()).map(x => x.id)
			};
		}));
	}

	res.sendAPIResponse(groups);
}

export default get_groups;
