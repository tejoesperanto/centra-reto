import * as cmds from '.';

export const helpBrief = "Montras tiun ĉi ekranon. Uzu `helpo [komando]` por ricevi detalan helpon pri komando.";

export async function cmd (bits, log) {
	if (bits.length === 0 || (bits.length === 1 && bits[0] == 'helpo')) {
		// General help
		let cmdsSorted = Object.keys(cmds).sort();
		// Move 'helpo' to the beginning
		cmdsSorted.splice(cmdsSorted.indexOf('helpo'), 1);
		cmdsSorted.unshift('helpo');

		// Print the help message
		let helpMessage = `
Validaj komandoj
================\n`;
		for (let cmd of cmdsSorted) {
			helpMessage += `\n- ${cmd}: ${cmds[cmd].helpBrief}`;
		}

		log('info', helpMessage);
	} else if (bits.length === 1) {
		// Command help
		if (!(bits[0] in cmds)) {
			log('error', 'nekonata komando `%s`', bits[0]);
			return;
		}
		log('info', 'uzado de `%s`:\n%s', bits[0], cmds[bits[0]].helpDetailed);
	} else {
		// Error
		log('SYNTAX');
	}
}
