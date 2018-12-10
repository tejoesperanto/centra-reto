import * as cirkulero from '../../../api/cirkulero';
import User from '../../../api/user';

async function get_contributions (req, res, next) {
	/**
	 * POST /close
	 * Closes a cirkulero for contributions
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
	 *     role_comment         (string)      The user's role comment
	 *     long_name            (string|null) The user's long name or null if the user hasn't completed the initial setup
	 *     full_name_latin_sort (string|null) The user's full name for sorting purposes or null if the user hasn't completed the initial setup
	 *   faris             (string[])    What the user did during the month
	 *   faras             (string[])    What the user is still doing
	 *   faros             (string[])    What the user will be doing
	 *   comment           (string|null) A comment on the user's contribution
	 *   modified_by_admin (boolean)     Whether the contribution was modified by an admin
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
	const stmt = CR.db.cirkuleroj.prepare('select published from cirkuleroj where id = ?');
	const row = stmt.get(req.body.cirkulero_id);

	if (!row ||
		(!row.published && (!req.user || !await req.user.hasPermission('cirkuleroj.manage')))) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	const contribsRaw = cirkulero.getAllContributions(req.body.cirkulero_id);
	const contribsRes = [];

	for (let contrib of contribsRaw) {
		const user = User.getUserById(contrib.user_id);
		const userData = {
			id: null,
			email: null,
			group_id: contrib.group_id,
			role: contrib.user_role,
			role_comment: contrib.user_role_comment,
			long_name: null,
			full_name_latin_sort: null
		};
		if (user) { // The user should always be present as we do not delete user names from the db, this is just extra redundancy
			userData.id = contrib.user_id;
			userData.email = user.email;
			userData.long_name = user.getLongName() || null;
			userData.full_name_latin_sort = user.getNameDetails().fullNameLatinSort || null;
		}

		contribsRes.push({
			user: userData,
			faris: JSON.parse(contrib.faris),
			faras: JSON.parse(contrib.faras),
			faros: JSON.parse(contrib.faros),
			comment: contrib.comment,
			modified_by_admin: !!contrib.modified_by_admin
		});
	}

	res.sendAPIResponse({
		contributions: contribsRes
	});
}

export default get_contributions;
