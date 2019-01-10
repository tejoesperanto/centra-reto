import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'pn/fs';
import path from 'path';
import mergeOptions from 'merge-options';

import * as CRUtil from './util';

/**
 * Sets up the mail system
 */
export function init () {
	CR.log.info("Pretigas SMTP-klienton")
	CR.smtp = nodemailer.createTransport(CR.conf.servers.smtp);

	if (CR.conf.debugMail) {
		CR.log.warn('Sendado de retmesaĝoj en TEST-moduso');
	}

	CR.log.info("SMTP-kliento pretas")
}

/**
 * Applies necessary headers such as `from`, then sends a mail
 * @param  {Object}  options       The options to be sent to nodemailer
 * @param  {boolean} [throwErrors] If true errors won't be silently eaten
 */
export async function sendMail (options, throwErrors = false) {
	if (!options.from) {
		options.from = CR.conf.emailFrom;
	}

	if (CR.conf.debugMail) {
		options.subject = `[POR ${options.to}] ` + options.subject;
		options.to = CR.conf.debugMail;
	}

	if (options.subject) {
		options.subject = CR.conf.emailSubjectPrefix + options.subject;
	}

	try {
		await CR.smtp.sendMail(options);
	} catch (e) {
		if (throwErrors) { throw e; }
		
		if (e.code === 'EENVELOPE') {
			const bits = /^(\d{3}) (\d.\d.\d) (.*)$/.exec(e.response);
			if (bits) {
				const smtpError = bits[2].split('.').map(x => parseInt(x, 10));

				// See https://www.iana.org/assignments/smtp-enhanced-status-codes/smtp-enhanced-status-codes.xhtml
				if (smtpError[1] >= 1 && smtpError[1] <= 5) { // Recipient/user error, silently ignore
					return;
				}
			}
		}

		// It's actually our fault, silently ignore it and log it to the console for future inspection
		CR.log.error(e);
	}
}

/**
 * Renders an email from a template
 * @param  {string} template     The name of the email template
 * @param  {Object} templateData The view for the email render
 * @return {Object} Contains the keys `string html`, `string text` and `Object data`, which is the amended view including the data in the template json file.
 */
export async function renderMail (template, templateData) {
	// Obtain template files
	const templateDir = path.join(CR.filesDir, 'email', 'templates');
	const templates = await CRUtil.promiseAllObject({
		HTMLHead: fs.readFile(path.join(templateDir, 'email_head.html'), 'utf8'),
		HTMLFoot: fs.readFile(path.join(templateDir, 'email_foot.html'), 'utf8'),
		HTMLTmpl: fs.readFile(path.join(templateDir, template, template + '.html'), 'utf8'),

		TextHead: fs.readFile(path.join(templateDir, 'email_head.txt'),  'utf8'),
		TextFoot: fs.readFile(path.join(templateDir, 'email_foot.txt'),  'utf8'),
		TextTmpl: fs.readFile(path.join(templateDir, template, template + '.txt'), 'utf8'),

		DataTmpl: fs.readFile(path.join(templateDir, template, template + '.json'), 'utf8')
	});

	const view = mergeOptions({
		preheader_spaces: '\u200c\u00a0'.repeat(200)
	}, JSON.parse(templates.DataTmpl), templateData);

	// Render mail
	const mail = {};

	// Render HTML
	mail.html  = CRUtil.renderTemplate(templates.HTMLHead, view);
	mail.html += CRUtil.renderTemplate(templates.HTMLTmpl, view);
	mail.html += CRUtil.renderTemplate(templates.HTMLFoot, view);

	mail.text  = CRUtil.renderTemplate(templates.TextHead, view);
	mail.text += CRUtil.renderTemplate(templates.TextTmpl, view);
	mail.text += CRUtil.renderTemplate(templates.TextFoot, view);

	mail.data = view;

	return mail;
}

/**
 * Renders and sends an email
 * @param  {string} template     The name of the email template
 * @param  {Object} templateData The view for the email render
 * @param  {Object} options      The options to be sent to nodemailer
 */
export async function renderSendMail (template, templateData, sendOptions) {
	// Render the mail
	const mail = await renderMail(template, templateData);
	sendOptions.text = mail.text;
	sendOptions.html = mail.html;
	if (!sendOptions.subject) { sendOptions.subject = mail.data.subject; }

	// Embed the pictures
	const emailImgDir = path.join(CR.filesDir, 'email', 'img');
	const embeddedImgs = [ 'emblemo.png', mail.data.header_image_file ];

	sendOptions.attachments = [];
	for (let img of embeddedImgs) {
		sendOptions.attachments.push({
			filename: img,
			path: path.join(emailImgDir, img),
			cid: img
		});
	}

	// Send the mail
	await sendMail(sendOptions);
}
