import { promisify } from 'util';
import readline from 'readline';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import * as cmds from './cmds';

function init () {
	handleCmd();
}

async function handleCmd () {
	CR.reader.prompt(true);
	const cmdRaw = await readCmd();
	
	await parseCmd(cmdRaw);

	handleCmd();
}

async function parseCmd (cmdRaw) {
	// Parse command as csv
	const cmdParsed = await csvParse(cmdRaw, {
		delimiter: ' ',
		trim: true
	});

	// Trimming doesn't work when the delimiter is a space so we need to remove empty fields manually
	const cmdBits = cmdParsed[0].filter(bit => bit.length > 0);

	// Ensure that the command exists
	if (!(cmdBits[0] in cmds)) {
		// Command doesn't exist
		logCmd('info', cmdBits[0], "komando ne trovita")
		return;
	}

	cmds[cmdBits[0]].cmd(cmdBits.slice(1));
}

function readCmd () {
	return new Promise((resolve, reject) => {
		CR.reader.question('> ', cmdRaw => {
			resolve(cmdRaw);
		});
	});
}

function logCmd (type, cmd, text, format) {
	CR.log[type](`${cmd}: ${text}`, format);
}

export default {
	init: init,
	logCmd: logCmd
}
