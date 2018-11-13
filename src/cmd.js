import readline from 'readline';

function init () {
	handleCmd();
};

async function handleCmd () {
	CR.reader.prompt(true);
	const cmdRaw = await readCmd();
	CR.log.info("Received command: %s", cmdRaw);

	handleCmd();
}

function readCmd () {
	return new Promise((resolve, reject) => {
		CR.reader.question('> ', cmdRaw => {
			resolve(cmdRaw);
		});
	});
}

export default {
	init: init
}
