import * as cirkulero from '../../../api/cirkulero';

async function get_own_contributions (req, res, next) {
	/**
	 * POST /get_own_contributions
	 * Gets all the user's contributions to a given cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * User must partain to group permitted to contribute to cirkuleroj (see api/cirkulero/mayUserContributeToCirkuleroj)
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *
	 * Returns:
	 *   group_id          (number)
	 *   user_role_comment (string)
	 *   faris             (string[])
	 *   faras             (string[])
	 *   faros             (string[])
	 *   comment           (string)
	 *
	 * Throws:
	 * INVALID_ARGUMENT   [argument]
	 * MAY_NOT_CONTRIBUTE            The user may not contribute to cirkuleroj
	 * INVALID_CIRKULERO             The cirkulero with the provided id either doesn't exist or isn't open to contributions
	 */

	if (!await cirkulero.mayUserContributeToCirkuleroj(req.user)) {
		res.sendAPIError('MAY_NOT_CONTRIBUTE');
		return;
	}
	
	// Begin data validation
	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}
	// End data validation

	let stmt = CR.db.cirkuleroj.prepare('select open from cirkuleroj where id = ?');
	const row = stmt.get(req.body.cirkulero_id);

	if (!row || !row.open) {
		res.sendAPIError('INVALID_CIRKULERO');
		return;
	}

	stmt = CR.db.cirkuleroj.prepare('select group_id, user_role_comment, faris, faras, faros, comment from cirkuleroj_contributions where cirkulero_id = ? and user_id = ?');
	const rows = stmt.all(req.body.cirkulero_id, req.user.id);

	const contribs = [];
	for (let row of rows) {
		contribs.push({
			group_id: row.group_id,
			user_role_comment: row.user_role_comment,
			faris: JSON.parse(row.faris),
			faras: JSON.parse(row.faras),
			faros: JSON.parse(row.faros),
			comment: row.comment
		});
	}

	res.sendAPIResponse({
		contributions: contribs
	});
}

export default get_own_contributions;
