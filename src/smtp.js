import nodemailer from 'nodemailer';

function init () {
	CR.log.info("Pretigas SMTP-servilon")
	CR.smtp = nodemailer.createTransport(CR.conf.servers.smtp);
	CR.log.info("SMTP-servilo pretas")
}

async function sendMail (options) {
	if (!options.from) {
		options.from = CR.conf.emailFrom;
	}

	await CR.smtp.sendMail(options); // might throw an error
}

export default {
	init: init,
	sendMail: sendMail
};
