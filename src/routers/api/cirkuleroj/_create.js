import moment from 'moment';

async function create (req, res, next) {
	/**
	 * POST /create
	 * Creates a new cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   id        (number)  The id of the cirkulero
	 *   name      (string)  The name of the cirkulero
	 *   deadline  (number)  The unix time of the cirkulero deadline
	 *                       Must be higher than the current unix time
	 *   open      (boolean) Whether the cirkulero is open for contributions right away
	 *   [note]    (string)  The note for use in cirkulero reminders
	 *   reminders (boolean) Whether to send automatic reminders for this cirkulero
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * ID_TAKEN                    If there's already a cirkulero with this id
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	// Begin data validation
	const fields = [
		'id',
		'name',
		'deadline',
		'open',
		'reminders'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['id']);
		return;
	}

	if (typeof req.body.name !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}

	if (!Number.isSafeInteger(req.body.deadline) || req.body.deadline < moment().unix()) {
		res.sendAPIError('INVALID_ARGUMENT', ['deadline']);
		return;
	}

	if (typeof req.body.open !== 'boolean') {
		res.sendAPIError('INVALID_ARGUMENT', ['open']);
		return;
	}

	const note = req.body.note || null;
	if (typeof 'note' !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['note']);
		return;
	}

	if (typeof req.body.reminders !== 'boolean') {
		res.sendAPIError('INVALID_ARGUMENT', ['reminders']);
		return;
	}
	// End data validation

	// Check if the id is taken
	let stmt = CR.db.cirkuleroj.prepare('select 1 from cirkuleroj where id = ?');
	const exists = !!stmt.get(req.body.id);
	if (exists) {
		res.sendAPIError('ID_TAKEN');
		return;
	}

	// Insert the cirkulero
	stmt = CR.db.cirkuleroj.prepare('insert into cirkuleroj (id, name, deadline, `open`, note, reminders) values (@id, @name, @deadline, @open, @note, @reminders)');
	stmt.run({
		id: req.body.id,
		name: req.body.name,
		deadline: req.body.deadline,
		open: +req.body.open,
		note: note,
		reminders: +req.body.reminders
	});

	res.sendAPIResponse();
}

export default create;
