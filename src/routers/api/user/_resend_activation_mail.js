import * as CRMail from '../../../mail';
import User from '../../../api/user';

async function resend_activation_mail (req, res, next) {
	/**
	 * POST /resend_activation_mail
	 * Resends the activation email to a user and renews the validity of the activation key
	 *
	 * Login required
	 * Initial setup required
	 * 
	 * Parameters:
	 * user_id (number) The id of the user
	 *
	 * Permissions required:
	 * users.modify
	 *
	 * Returns:
	 * activation_key (string) The user's new activation key
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * USER_NOT_FOUND
	 * USER_ACTIVATED              The user has already been activated.
	 */
	
	if (!await req.requirePermissions('users.modify')) { return; }

	const fields = [
		'user_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.user_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['user_id']);
		return;
	}

	const user = await User.getUserById(req.body.user_id);

	if (!user) {
		res.sendAPIError('USER_NOT_FOUND', ['user_id']);
		return;
	}

	if (user.password) { // User has already been activated
		res.sendAPIError('USER_ACTIVATED');
		return;
	}

	const activationKey = await user.createNewActivationKey();
	const activationURL = user.getActivationURL();

	await CRMail.renderSendMail('new_account', {
		activation_link: activationURL,
		sender_name: req.user.getLongName()
	}, {
		to: user.email
	});

	res.sendAPIResponse({
		activation_key: activationKey
	});
}

export default resend_activation_mail;
