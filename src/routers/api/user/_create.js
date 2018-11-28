import * as CRApi from '..';
import * as CRMail from '../../../mail';
import User from '../../../api/user';
import { removeUnsafeCharsOneLine } from '../../../util';

async function user_create (req, res, next) {
	/**
	 * POST /create
	 * Creates a new user
	 *
	 * email      (string)  The email of the user
	 * send_email (boolean) Whether to send an email with the activation link
	 *
	 * Login required
	 * Initial setup required
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
	
	if (!(await req.user.hasPermission('users.create'))) {
		CRApi.sendError(res, 'MISSING_PERMISSION');
		return;
	}

	const fields = [
		'email',
		'send_email'
	];
	if (!CRApi.handleRequiredFields(req, res, fields)) { return; }

	const email = removeUnsafeCharsOneLine(req.body.email);

	const isTaken = User.isEmailTaken(email);
	if (isTaken) {
		CRApi.sendError(res, 'EMAIL_TAKEN');
		return;
	}

	const user = await User.createUser(email);

	if (req.body.send_email) {
		const activationURL = user.getActivationURL();
		await CRMail.renderSendMail('new_account', {
			activation_link: activationURL
		}, {
			to: email
		});
	}

	CRApi.sendResponse(res, {
		uid: user.id,
		activation_key: user.activationKey
	});
}

export default user_create;
