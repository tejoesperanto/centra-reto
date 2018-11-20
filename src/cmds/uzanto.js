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

			// Verify the email
			const emailResponse = await CRCmd.promptYesNo(`Kreos konton por homo kun la retpoŝtadreso ${email}.`);
			if (!emailResponse) {
				return;
			}

			const user = User.createUser(email);
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
