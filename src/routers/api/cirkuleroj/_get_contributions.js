import * as CRCirkulero from '../../../api/cirkulero';
import User from '../../../api/user';

async function get_contributions (req, res, next) {
	/**
	 * POST /get_contributions
	 * Gets all potential contributions to a cirkulero
	 *
	 * Login not required
	 * Initial setup required if logged in
	 *
	 * Permissions required:
	 * cirkuleroj.manage (Only if trying to read a cirkulero that's not yet been published)
	 *
	 * Parameters:
	 *   cirkulero_id (number)
	 *
	 * Returns:
	 * contributions (Object[]) The contributions in the order in which they came
	 *   user (Object) The details of the contributor
	 *     id                   (number|null) The user's id or null if the user has been deleted
	 *     email                (string)      The user's email address
	 *     group_id             (number)      The user's group id for this contribution
	 *     role                 (string)      The user's role
	 *     long_name            (string|null) The user's long name or null if the user hasn't completed the initial setup
	 *     full_name_latin_sort (string|null) The user's full name for sorting purposes or null if the user hasn't completed the initial setup
	 *   contrib (Object|null) The details of the contrib or null if not present
	 *     role_comment      (string)      The user's role comment
	 *     faris             (string[])    What the user did during the month
	 *     faras             (string[])    What the user is still doing
	 *     faros             (string[])    What the user will be doing
	 *     comment           (string|null) A comment on the user's contribution
	 *     modified_by_admin (boolean)     Whether the contribution was modified by an admin
	 *   
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	// Try to find the cirkulero
	let stmt = CR.db.cirkuleroj.prepare('select published from cirkuleroj where id = ?');
	const cirk = stmt.get(req.body.cirkulero_id);

	if (!cirk ||
		(!cirk.published && (!req.user || !await req.user.hasPermission('cirkuleroj.manage')))) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	const contribsRaw = CRCirkulero.getAllContributions(req.body.cirkulero_id);
	const contribsRes = [];
	const contributorList = {};

	for (let contrib of contribsRaw) {
		const user = User.getUserById(contrib.user_id);

		if (!contributorList[contrib.group_id]) { contributorList[contrib.group_id] = []; }
		contributorList[contrib.group_id].push(contrib.user_id);

		const userGroups = await user.getGroups();
		const userRole = userGroups.get(contrib.group_id).user.name;

		contribsRes.push({
			user: {
				id: contrib.user_id,
				email: user.email,
				group_id: contrib.group_id,
				role: userRole,
				long_name: user.getLongName() || null,
				full_name_latin_sort: user.getNameDetails().fullNameLatinSort || null
			},
			contrib: {
				role_comment: contrib.user_role_comment,
				faris: JSON.parse(contrib.faris),
				faras: JSON.parse(contrib.faras),
				faros: JSON.parse(contrib.faros),
				comment: contrib.comment,
				modified_by_admin: !!contrib.modified_by_admin
			}
		});
	}

	// Find and add all non contribs
	if (cirk.published) {
		let allowedContributors = [];
		stmt = CR.db.cirkuleroj.prepare('select allowed_contributors from cirkuleroj_published where cirkulero_id = ?');
		const row = stmt.get(req.body.cirkulero_id);
		for (let userInfo of JSON.parse(row.allowed_contributors)) {
			for (let groupInfo of userInfo.groups) {
				if (contributorList[groupInfo.id] && contributorList[groupInfo.id].indexOf(userInfo.user) > -1) {
					continue; // The user contributed and shouldn't be included as a non-contributor
				}
				allowedContributors.push({
					user: User.getUserById(userInfo.user),
					group: groupInfo.id,
					groupName: groupInfo.name
				});
			}
		}

		for (let entry of allowedContributors) {
			contribsRes.push({
				user: {
					id: entry.user.id,
					email: entry.user.email,
					group_id: entry.group,
					role: entry.groupName,
					long_name: entry.user.getLongName() || null,
					full_name_latin_sort: entry.user.getNameDetails().fullNameLatinSort || null
				},
				contrib: null
			});
		}
	} else {
		const users = await CRCirkulero.getAllowedContributors();
		const promises = users.map(async user => {
			const groups = await CRCirkulero.getUserCirkuleroContributionGroups(user);

			for (let group of groups) {
				if (contributorList[group.group.id] && contributorList[group.group.id].indexOf(user.id) > -1) {
					continue; // The user contributed and shouldn't be included as a non-contributor
				}

				contribsRes.push({
					user: {
						id: user.id,
						email: user.email,
						group_id: group.group.id,
						role: group.user.name,
						long_name: user.getLongName() || null,
						full_name_latin_sort: user.getNameDetails().fullNameLatinSort || null
					},
					contrib: null
				});
			}
		});
		await Promise.all(promises);
	}

	res.sendAPIResponse({
		contributions: contribsRes
	});
}

export default get_contributions;
