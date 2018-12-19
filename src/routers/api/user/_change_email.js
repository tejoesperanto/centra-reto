import { removeUnsafeCharsOneLine } from '../../../util';

async function change_email (req, res, next) {
	/**
	 * POST /change_email
	 * Changes the user's primary email address
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * email (string) The new email address
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	const fields = [
		'email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}
	const email = removeUnsafeCharsOneLine(req.body.email);

	const stmt = CR.db.users.prepare('update users set email = ? where id = ?');
	stmt.run(email, req.user.id);
	req.user.email = email;

	res.sendAPIResponse();
}

export default change_email;
