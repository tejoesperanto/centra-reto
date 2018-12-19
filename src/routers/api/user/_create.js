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
	 * send_email (boolean) Whether to send an email with the activation link
	 *
	 * Permissions required:
	 * users.create
	 *
	 * Throws:
	 * EMAIL_TAKEN
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

	const email = removeUnsafeCharsOneLine(req.body.email);

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
