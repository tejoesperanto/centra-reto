import moment from 'moment';

import { removeUnsafeCharsOneLine } from '../../../util';

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
	 *                       Max length: 50 chars
	 *   deadline  (number)  The unix time of the cirkulero deadline
	 *                       Must be higher than the current unix time
	 *   open      (boolean) Whether the cirkulero is open for contributions right away
	 *   [note]    (string)  The note for use in cirkulero reminders
	 *                       Max length: 1000 chars
	 *   reminders (boolean) Whether to send automatic reminders for this cirkulero
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * ID_TAKEN                    If there's already a cirkulero with this id
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const timeNow = moment().unix();

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

	if (typeof req.body.name !== 'string' || req.body.name.length > 50) {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}

	if (!Number.isSafeInteger(req.body.deadline) || req.body.deadline < timeNow) {
		res.sendAPIError('INVALID_ARGUMENT', ['deadline']);
		return;
	}

	if (typeof req.body.open !== 'boolean') {
		res.sendAPIError('INVALID_ARGUMENT', ['open']);
		return;
	}

	let note = null;
	if (req.body.note && typeof req.body.note !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['note']);
		return;
	}
	if (req.body.note) {
		note = removeUnsafeCharsOneLine(req.body.note);
		if (req.body.note.length > 1000) {
			res.sendAPIError('INVALID_ARGUMENT', ['note']);
			return;
		}
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
		name: removeUnsafeCharsOneLine(req.body.name.toLowerCase()),
		deadline: req.body.deadline,
		open: +req.body.open,
		note: note,
		reminders: 0
	});

	// Remove old reminders if necessary
	if (req.body.reminders) {
		const time = req.body.deadline - timeNow; // t < d - Δt <=> d - t < Δt

		stmt = CR.db.cirkuleroj.prepare('select id from reminders_direct where delta_time > ?');
		const remindersDirect = stmt.all(time).map(x => x.id);

		stmt = CR.db.cirkuleroj.prepare('insert into reminders_direct_sent (reminder_id, cirkulero_id) values (?, ?)');
		for (let reminder of remindersDirect) {
			stmt.run(reminder, req.body.id);
		}

		stmt = CR.db.cirkuleroj.prepare('select id from reminders_lists where delta_time > ?');
		const remindersLists = stmt.all(time).map(x => x.id);

		stmt = CR.db.cirkuleroj.prepare('insert into reminders_lists_sent (reminder_id, cirkulero_id) values (?, ?)');
		for (let reminder of remindersLists) {
			stmt.run(reminder, req.body.id);
		}

		// Enable reminders
		stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set reminders = 1 where id = ?');
		stmt.run(req.body.id);
	}

	res.sendAPIResponse();
}

export default create;
