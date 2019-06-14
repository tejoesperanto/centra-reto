import { removeUnsafeChars } from '../../../util';

async function update_note (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /update_note
	 * Updates a cirkulero's note
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *   note         (string) The new note of the cirkulero
	 *                         Max length: 1000 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id',
		'note'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (typeof req.body.note !== 'string' || req.body.note.length > 1000) {
		res.sendAPIError('INVALID_ARGUMENT', ['note']);
		return;
	}
	const note = removeUnsafeChars(req.body.note);

	const stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set note = ? where id = ?');
	stmt.run(note, req.body.cirkulero_id);

	res.sendAPIResponse();
}

export default update_note;
