import * as CRApi from '..';
import User from '../../../api/user';

async function user_list (req, res, next) {
	/**
	 * POST /list
	 * Lists all users
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * users.view
	 *
	 * Parameters:
	 * See routers/api#performListQueryStatement
	 *
	 * Permitted cols:
	 * id, full_name_latin, full_name_native, full_name_latin_sort, nickname, pet_name, email, enabled, activation_key_time
	 * 
	 * Returns:
	 * rows_total    (number)   The amount of rows in the table in total
	 * rows_filtered (number)   The amount of rows in the table after filtering
	 * data          (Object[]) The rows
	 *   id                   (number)      The user's id
	 *   name                 (string)      The user's full name with the optional pet name in parenthesis at the end
	 *   full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 *   full_name_native     (string|null) The user's full name written in the native writing system in the native order
	 *   full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 *   nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 *   pet_name             (string|null) (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 *   email                (string)      The user's primary email address
	 *   enabled              (boolean)     Whether the user is enabled
	 *   active               (boolean)     Whether the user has activated their account
	 *   set_up               (boolean)     Whether the user has completed the initial setup
	 *   activation_key_time  (number)      The time the user's activation key expires
	 * 
	 * Throws:
	 * See routers/api#performListQueryStatement
	 */
	
	if (!await req.requirePermissions('users.view')) { return; }

	const table = 'users left join users_details on users_details.user_id = users.id';
	const dbData = await CRApi.performListQueryStatement({
		req: req,
		res: res,
		db: CR.db.users,
		table: table,
		colsAllowed: [
			'id',
			'full_name_latin',
			'full_name_native',
			'full_name_latin_sort',
			'nickname',
			'pet_name',
			'email',
			'enabled',
			'activation_key',
			'activation_key_time'
		],
		alwaysSelect: [
			'full_name_latin',
			'pet_name',
			'activation_key_time'
		],
		customCols: [
			'name',
			'active',
			'set_up'
		]
	});

	if (!dbData) { return; }

	const output = dbData.data.map(row => {
		const rowOutput = {};
		for (let col of dbData.select) {
			const val = row[col];

			if (col === 'name') {
				rowOutput[col] = User.formatLongName(row.full_name_latin, row.pet_name);

			} else if (col === 'enabled') {
				rowOutput[col] = !!val;

			} else if (col === 'active') {
				rowOutput[col] = !row.activation_key_time;

			} else if (col === 'set_up') {
				rowOutput[col] = !!row.full_name_latin; // This key is only present if the initial set up has been completed

			} else if (dbData.select.indexOf(col) > -1) {
				rowOutput[col] = val;
			}
		}
		return rowOutput;
	});

	res.sendAPIResponse({
		data: output,
		rows_total: dbData.rowsTotal,
		rows_filtered: dbData.rowsFiltered
	});
}

export default user_list;
