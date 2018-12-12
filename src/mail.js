import nodemailer from 'nodemailer';
import Mustache from 'mustache';
import fs from 'pn/fs';
import path from 'path';
import mergeOptions from 'merge-options';

import * as CRUtil from './util';

/**
 * Sets up the mail system
 */
export function init () {
	CR.log.info("Pretigas SMTP-servilon")
	CR.smtp = nodemailer.createTransport(CR.conf.servers.smtp);
	CR.log.info("SMTP-servilo pretas")
}

/**
 * Applies necessary headers such as `from`, then sends a mail
 * @param  {Object} options The options to be sent to nodemailer
 */
export async function sendMail (options) {
	if (!options.from) {
		options.from = CR.conf.emailFrom;
	}

	if (options.subject) {
		options.subject = CR.conf.emailSubjectPrefix + options.subject;
	}

	await CR.smtp.sendMail(options); // might throw an error
}

/**
 * Renders an email from a template
 * @param  {string} template     The name of the email template
 * @param  {Object} templateData The view for the email render
 * @return {Object} Contains the keys `string html`, `string text` and `Object data`, which is the amended view including the data in the template json file.
 */
export async function renderMail (template, templateData) {
	if (!CR.cacheEnabled) {
		Mustache.clearCache();
	}

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

	const view = mergeOptions(JSON.parse(templates.DataTmpl), templateData);

	// Render mail
	const mail = {};

	// Render HTML
	mail.html  = Mustache.render(templates.HTMLHead, view);
	mail.html += Mustache.render(templates.HTMLTmpl, view);
	mail.html += Mustache.render(templates.HTMLFoot, view);

	mail.text  = Mustache.render(templates.TextHead, view);
	mail.text += Mustache.render(templates.TextTmpl, view);
	mail.text += Mustache.render(templates.TextFoot, view);

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
