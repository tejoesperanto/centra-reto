import { promisify } from 'util';
import readline from 'readline';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import * as cmds from './cmds';

export function init () {
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
		logCmd('error', cmdBits[0], "komando ne trovita")
		return;
	}

	try {
		await cmds[cmdBits[0]].cmd(
			cmdBits.slice(1),
			(type, text, ...format) => {
				if (type === 'SYNTAX') {
					type = 'error';
					text = 'malĝusta sintakso, provu `helpo [komando]`';
				}
				logCmd(type, cmdBits[0], text, ...format);
			}
		);
	} catch (e) {
		logCmd('error', cmdBits[0], 'okazis eraro: %s', e.stack);
	}
}

function readCmd () {
	return new Promise((resolve, reject) => {
		CR.reader.question('> ', cmdRaw => { resolve(cmdRaw) });
	});
}

export function logCmd (type, cmd, text, ...format) {
	CR.log[type](`${cmd}: ${text}`, ...format);
}

export function prompt (q) {
	return new Promise((resolve, reject) => {
		CR.reader.question(q, a => { resolve(a) });
	});
}

export async function promptYesNo (q) {
	const response = await prompt(`${q}\nĈu vi volas daŭrigi? [J/n] `);
	const validResponses = [ 'j', 'y', '' ];
	const isValid = validResponses.indexOf(response.trim().toLowerCase()) > -1
	return isValid;
}
