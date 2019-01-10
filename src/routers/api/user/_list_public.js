import * as CRApi from '..';
import User from '../../../api/user';

async function list_public (req, res, next) {
	/**
	 * POST /list_public
	 * Lists all users
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Parameters:
	 * See routers/api#performListQueryStatement
	 *
	 * Permitted cols:
	 * id,full_name_latin, full_name_native, full_name_latin_sort, nickname, pet_name, email
	 * 
	 * Returns:
	 * rows_total    (number)   The amount of rows in the table in total
	 * rows_filtered (number)   The amount of rows in the table after filtering
	 * data          (Object[]) The rows
	 *   name                 (string)      The user's full name with the optional pet name in parenthesis at the end
	 *   full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 *   full_name_native     (string|null) The user's full name written in the native writing system in the native order
	 *   full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 *   nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 *   pet_name             (string|null) (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 *   email                (string)      The user's primary email address
	 *   groups               (string[])    The user's public groups
	 * 
	 * Throws:
	 * See routers/api#performListQueryStatement
	 */

	const table = 'users inner join users_details on users_details.user_id = users.id';
	const dbData = CRApi.performListQueryStatement({
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
			'email'
		],
		alwaysWhere: 'enabled = 1',
		alwaysSelect: [
			'id'
		],
		customCols: [
			'name',
			'groups'
		]
	});

	if (!dbData) { return; }

	const outputPromises = dbData.data.map(async row => {
		const rowOutput = {};
		const user = User.getUserById(row.id);

		for (let col of dbData.select) {
			const val = row[col];

			if (col === 'name') {
				rowOutput[col] = user.getLongName();

			} else if (col === 'groups') {
				const rawGroups = await user.getGroups();
				const groups = [];
				for (let group of rawGroups.values()) {
					if (!group.user.active) { continue; }
					if (!group.group.public) { continue; }
					groups.push(group.user.name);
				}
				rowOutput[col] = groups;

			} else if (dbData.select.indexOf(col) > -1) {
				rowOutput[col] = val;
			}
		}
		return rowOutput;
	});

	const output = await Promise.all(outputPromises);

	res.sendAPIResponse({
		data: output,
		rows_total: dbData.rowsTotal,
		rows_filtered: dbData.rowsFiltered
	});
}

export default list_public;
