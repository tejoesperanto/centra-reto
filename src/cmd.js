import { promisify } from 'util';
import readline from 'readline';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import * as cmds from './cmds';

let activePrompt = null;

/**
 * Sets up the command handler
 */
export function init () {
	// Forward signals from reader to process
	const forwardSignals = [ 'SIGINT', 'SIGHUP', 'SIGTERM' ];
	for (let signal of forwardSignals) {
		CR.reader.on(signal, (...args) => { handleSignal(signal, ...args); });
	}

	// Ignore ^D
	CR.reader.on('close', () => {
		if (activePrompt) { process.stdout.write('\n'); }
		CR.reader = readline.createInterface(process.stdin, process.stdout);
		init();
	});

	handleCmd();
}

/**
 * Handles IPC signals caught by readline and handles them internally or forwards them to the main process
 * @param  {string}    signal The signal type
 * @param  {...Object} args   Any args supplied by the signal event
 */
function handleSignal (signal, ...args) {
	if (activePrompt) {
		activePrompt.reject('close');
		CR.reader.write('\n');
	} else {
		process.emit(signal, ...args);
	}
}

/**
 * Handles the command input loop
 */
async function handleCmd () {
	CR.reader.prompt(true);
	const cmdRaw = await readCmd();
	
	await parseCmd(cmdRaw);

	handleCmd();
}

/**
 * Parses a raw command string and calls the command
 * @param  {string} cmdRaw The raw command string
 */
async function parseCmd (cmdRaw) {
	// Parse command as csv
	const cmdParsed = await csvParse(cmdRaw, {
		delimiter: ' ',
		trim: true
	});

	if (cmdParsed.length === 0) { return; }

	// Trimming doesn't work when the delimiter is a space so we need to remove empty fields manually
	const cmdBits = cmdParsed[0].filter(bit => bit.length > 0);

	// Ensure that the command exists
	if (!(cmdBits[0] in cmds)) {
		// Command doesn't exist
		logCmd('error', cmdBits[0], 'komando ne trovita');
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

/**
 * Prompts the user for a command
 * @return {string} The raw command string
 */
function readCmd () {
	return new Promise(resolve => {
		CR.reader.question('> ', cmdRaw => { resolve(cmdRaw); });
	});
}

/**
 * Logs command output
 * @param  {string}    type   The winston log type
 * @param  {string}    cmd    The name of the command responsible for logging
 * @param  {string}    text   The text to log
 * @param  {...Object} format Formatting args for text
 */
export function logCmd (type, cmd, text, ...format) {
	CR.log[type](`${cmd}: ${text}`, ...format);
}

/**
 * Prompts the user with a question and returns the answer
 * @param  {string} q The question
 * @return {string} The answer
 * @throws {string} { `close` is thrown if the user cancels the question. }
 */
export function prompt (q) {
	let closeHandler;
	const question = new Promise((resolve, reject) => {
		activePrompt = {
			resolve: resolve,
			reject: reject
		};

		CR.reader.question(q, a => {
			resolve(a);
			activePrompt = null;
		});
		closeHandler = () => {
			reject('close');
			activePrompt = null;
		};
		CR.reader.on('close', closeHandler);
	});
	question.finally(() => {
		CR.reader.removeListener('close', closeHandler);
	});
	return question;
}

/**
 * Asks the user a question and returns whether the answer was yes.
 * Rejects as 'close' if SIGINT is called.
 * @param  {string} q The question to ask
 * @param  {boolean} [continueText] Whether to append the text “Ĉu vi volas daŭrigi [J/n]
 * @return {boolean} Whether the user answered yes
 */
export async function promptYesNo (q, continueText = true) {
	if (continueText) { q += '\nĈu vi volas daŭrigi?'; }
	q += ' [J/n] ';
	const response = await prompt(q);
	if (response === null) { return false; }
	const validResponses = [ 'j', 'y', '' ];
	const isValid = validResponses.indexOf(response.trim().toLowerCase()) > -1;
	return isValid;
}

/**
 * Identical to promptYesNo, however instead of rejecting as 'close', false is returned instead.
 * @param  {string} q The question to ask
 * @param  {boolean} [continueText] Whether to append the text “Ĉu vi volas daŭrigi [J/n]
 * @return {boolean} Whether the user answered yes
 */
export async function promptYesNoClose (q, continueText = true) {
	let response;
	try {
		response = await promptYesNo(q, continueText);
	} catch (e) {
		if (e === 'close') {
			return false;
		} else {
			throw e;
		}
	}
	return response;
}
