import cmds from '.';

export function cmd (bits, log) {
	if (bits.length === 0) {
		// General help
	} else if (bits.length === 1) {
		// Command help
		
	} else {
		// Error
		log('SYNTAX');
	}
}
