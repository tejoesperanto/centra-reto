import { removeUnsafeCharsOneLine } from '../../../util';

async function rename (req, res, next) {
	/**
	 * POST /rename
	 * Renames a cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *   name         (string) The new name of the cirkulero
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id',
		'name'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (typeof req.body.name !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}
	const name = removeUnsafeCharsOneLine(req.body.name);

	const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set name = ? where id = ?');
	stmt.run(name, req.body.cirkulero_id);

	res.sendAPIResponse();
}

export default rename;
