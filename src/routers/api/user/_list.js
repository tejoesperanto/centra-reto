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
	 * See routers/api#generateListQueryStatement
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
	 * See routers/api#generateListQueryStatement
	 */
	
	if (!await req.requirePermissions('users.view')) { return; }

	const table = 'users left join users_details on users_details.user_id = users.id';
	const dbData = CRApi.performListQueryStatement(req, res, CR.db.users, table, [
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
		], [
		'id',
		'full_name_latin',
		'full_name_native',
		'full_name_latin_sort',
		'nickname',
		'pet_name',
		'email',
		'enabled',
		'activation_key'
		]);

	if (!dbData) { return; }

	const output = dbData.data.map(row => {
		const setUp = !!row.full_name_latin; // This key is only present if the initial set up has been completed
		return {
			id: row.id,
			name: User.formatLongName(row.full_name_latin, row.pet_name),
			full_name_latin: row.full_name_latin,
			full_name_native: row.full_name_native,
			full_name_latin_sort: row.full_name_latin_sort,
			nickname: row.nickname,
			pet_name: row.pet_name,
			email: row.email,
			enabled: !!row.enabled,
			active: !row.activation_key_time,
			set_up: setUp,
			activation_key: row.activation_key,
			activation_key_time: row.activation_key_time
		};
	});

	res.sendAPIResponse({
		data: output,
		rows_total: dbData.rowsTotal,
		rows_filtered: dbData.rowsFiltered
	});
}

export default user_list;
