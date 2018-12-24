import url from 'url';

import { removeUnsafeChars, promiseAllObject, escapeHTML } from '../../../util';
import * as CRCirkulero from '../../../api/cirkulero';
import * as CRMail from '../../../mail';

async function send_reminder_direct (req, res, next) {
	/**
	 * POST /send_reminder_direct
	 * Sends a direct reminder to everyone allowed to contribute to the given cirkulero who's not yet done so
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *   message      (string) The message to send
	 *                         Max length: 5000 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (typeof req.body.message !== 'string' || req.body.message.length > 5000) {
		res.sendAPIError('INVALID_ARGUMENT', ['message']);
		return;
	}
	const message = removeUnsafeChars(req.body.message);

	const users = await CRCirkulero.getAllNonContributors(req.body.cirkulero_id);

	const contribURL = url.resolve(CR.conf.addressPrefix, `cirkuleroj/${req.body.cirkulero_id}`);
	const prettyContribURL = contribURL.replace(/^https?:\/\/?/, '');

	res.sendAPIResponse(); // We do this now as sending everything may take quite a while

	const mailPromises = [];
	for (let user of Object.values(users)) {
		let name = user.getBriefName();
		if (!name) { name = 'cirkulerkontribuanto'; }

		let userMessage = message.replace(/{{nomo}}/g, name);

		let htmlMessage = escapeHTML(userMessage);

		userMessage = userMessage.replace(/{{ligilo}}/g, contribURL);
		htmlMessage = htmlMessage.replace(/{{ligilo}}/g, `<a href="${contribURL}">${prettyContribURL}</a>`);

		// Remove consecutive newlines
		userMessage = userMessage.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');
		htmlMessage = htmlMessage.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');

		const paragraphs = htmlMessage.split(/(?:\r?\n){2}/g)
			.map(par => par.split(/\r?\n/g).join('<br>'));

		mailPromises.push(CRMail.renderSendMail('cirkulero_reminder_direct', {
			preheader: `Vi ankoraŭ ne kontribuis al cirkulero ${req.body.cirkulero_id}.`,
			text: userMessage,
			paragraphs: paragraphs
		}, {
			subject: `Persona memorigo pri cirkulero ${req.body.cirkulero_id}`,
			to: user.email
		}));
	}

	await Promise.all(mailPromises);
}

export default send_reminder_direct;
