import readline from 'readline';

import User from '../api/user'
import * as CRCmd from '../cmd';

export async function cmd (bits, log) {
	if (bits.length < 1) {
		log('SYNTAX');
		return;
	}

	const commands = {
		krei: async function () {
			if (bits.length != 2) {
				log('SYNTAX');
				return;
			}

			const email = bits[1];

			// Ensure the email isn't taken
			const isTaken = User.isEmailTaken(email);
			if (isTaken) {
				log('error', 'retpoŝtadreso %s jam uzata', email);
				return;
			}

			// Ensure the user input the correct email
			const emailCorrect = await CRCmd.promptYesNoClose(`Kreos konton por homo kun la retpoŝtadreso ${email}.`);
			if (!emailCorrect) {
				return;
			}

			const user = await User.createUser(email);
			log('info', `Kreis konton. Iru al ${user.getActivationURL()} por aktivigi la konton.`);

			// Offer to send an email with the link
			const sendEmail = await CRCmd.promptYesNoClose(`Ĉu vi volas sendi invitretmesaĝon kun la aktivigligilo?`, false);
			if (!sendEmail) {
				return;
			}

			// TODO: Send the email
		}
	};

	if (!(bits[0] in commands)) {
		log('error', 'nekonata komando `%s`', bits[0])
		return;
	}

	await commands[bits[0]]();
}

export const helpBrief = 'Iloj rilate al uzantoj.';

export const helpDetailed = `
- uzanto krei <retpoŝtadreso>
  Kreas novan uzanton kun la indikita retpoŝtadreso. Poste estas donita aktivigligilo, kiu povas esti sendita al la uzanto per retpoŝto.
`.trim();
