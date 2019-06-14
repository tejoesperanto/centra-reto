import { removeUnsafeCharsOneLine } from '../../../util';
import User from '../../../api/user';

async function change_email (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /change_email
	 * Changes the user's primary email address
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * email (string) The new email address
	 *                Max length: 500 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * EMAIL_TAKEN
	 */
	
	const fields = [
		'email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string' || req.body.email.length > 500) {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}

	const email = removeUnsafeCharsOneLine(req.body.email);

	if (User.isEmailTaken(email)) {
		res.sendAPIError('EMAIL_TAKEN');
		return;
	}

	await req.user.changeEmail(email, true);

	res.sendAPIResponse();
}

export default change_email;
