import * as CRMail from '../../../mail';
import User from '../../../api/user';
import { removeUnsafeCharsOneLine } from '../../../util';

async function user_create (req, res, next) {
	/**
	 * POST /create
	 * Creates a new user
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * email      (string)  The email of the user
	 *                      Max length: 500 chars
	 * send_email (boolean) Whether to send an email with the activation link
	 *
	 * Permissions required:
	 * users.create
	 *
	 * Throws:
	 * EMAIL_TAKEN
	 * INVALID_ARGUMENT [argument]
	 *
	 * Returns:
	 * uid            (number) The user's id
	 * activation_key (string) The user's activation key
	 */
	
	if (!await req.requirePermissions('users.create')) { return; }

	const fields = [
		'email',
		'send_email'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.email !== 'string' || req.body.email.length > 500) {
		res.sendAPIError('INVALID_ARGUMENT', ['email']);
		return;
	}
	const email = removeUnsafeCharsOneLine(req.body.email);

	if (typeof req.body.send_email !== 'boolean') {
		res.sendAPIError('INVALID_ARGUMENT', ['send_email']);
		return;
	}

	const isTaken = User.isEmailTaken(email);
	if (isTaken) {
		res.sendAPIError('EMAIL_TAKEN');
		return;
	}

	const user = await User.createUser(email);

	if (req.body.send_email) {
		const activationURL = user.getActivationURL();
		await CRMail.renderSendMail('new_account', {
			activation_link: activationURL,
			sender_name: req.user.getLongName()
		}, {
			to: email
		});
	}

	res.sendAPIResponse({
		uid: user.id,
		activation_key: user.activationKey
	});
}

export default user_create;
