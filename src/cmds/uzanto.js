export function cmd (bits, log) {
	if (bits.length < 1) {
		log('SYNTAX');
		return;
	}

	const commands = {
		krei: function () {
			if (bits.length != 2) {
				log('SYNTAX');
				return;
			}

			// TODO: Create account
		}
	};

	if (!(bits[0] in commands)) {
		log('error', 'nekonata komando `%s`', bits[0])
		return;
	}

	commands[bits[0]]();
}

export const helpBrief = 'Iloj rilate al uzantoj.';

export const helpDetailed = `
- uzanto krei <retpoŝtadreso>
  Kreas novan uzanton kun la indikita retpoŝtadreso. Poste estas donita aktivigligilo, kiu povas esti sendita al la uzanto per retpoŝto.
`.trim();
