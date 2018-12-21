import moment from 'moment';

async function update_deadline (req, res, next) {
	/**
	 * POST /update_deadline
	 * Updates a cirkulero's deadline
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *   deadline     (number) The cirkulero's new deadline, must be higher than the current unix time
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id',
		'deadline'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (!Number.isSafeInteger(req.body.deadline) || req.body.deadline < moment().unix()) {
		res.sendAPIError('INVALID_ARGUMENT', ['deadline']);
		return;
	}

	const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set deadline = ? where id = ?');
	stmt.run(req.body.deadline, req.body.cirkulero_id);

	res.sendAPIResponse();
}

export default update_deadline;
