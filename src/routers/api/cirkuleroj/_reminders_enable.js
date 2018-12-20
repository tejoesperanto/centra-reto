import moment from 'moment';

async function reminders_enable (req, res, next) {
	/**
	 * POST /reminders_enable
	 * Enables reminders for a cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number) The id of the cirkulero
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * CIRKULERO_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	// Obtain the cirkulero
	let stmt = CR.db.cirkuleroj.prepare('select deadline from cirkuleroj where id = ?');
	const cirk = stmt.get(req.body.cirkulero_id);
	if (!cirk) {
		res.sendAPIError('CIRKULERO_NOT_FOUND');
		return;
	}

	// Remove old reminders if necessary
	const timeNow = moment().unix();
	const time = cirk.deadline - timeNow; // t < d - Δt <=> d - t < Δt

	stmt = CR.db.cirkuleroj.prepare('select id from reminders_direct where delta_time > ?');
	const remindersDirect = stmt.all(time).map(x => x.id);

	stmt = CR.db.cirkuleroj.prepare('insert into reminders_direct_sent (reminder_id, cirkulero_id) values (?, ?)');
	for (let reminder of remindersDirect) {
		stmt.run(reminder, req.body.cirkulero_id);
	}

	stmt = CR.db.cirkuleroj.prepare('select id from reminders_lists where delta_time > ?');
	const remindersLists = stmt.all(time).map(x => x.id);

	stmt = CR.db.cirkuleroj.prepare('insert into reminders_lists_sent (reminder_id, cirkulero_id) values (?, ?)');
	for (let reminder of remindersLists) {
		stmt.run(reminder, req.body.cirkulero_id);
	}

	// Enable reminders
	stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set reminders = 1 where id = ?');
	stmt.run(req.body.cirkulero_id);

	res.sendAPIResponse();
}

export default reminders_enable;
