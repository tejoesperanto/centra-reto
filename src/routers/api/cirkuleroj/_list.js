import * as CRApi from '..';

async function list (req, res, next) {
	/**
	 * POST /list
	 * Lists all cirkuleroj
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 * See routers/api#performListQueryStatement
	 *
	 * Permitted cols:
	 * id, name, deadline, open, published, note
	 * 
	 * Returns:
	 * rows_total    (number)   The amount of rows in the table in total
	 * rows_filtered (number)   The amount of rows in the table after filtering
	 * data          (Object[]) The rows
	 *   id        (number)      The id of the cirkulero
	 *   name      (string)      The name of the cirkulero
	 *   deadline  (number)      The unix time deadline of the cirkulero
	 *   open      (boolean)     Whether the cirkulero is open for contributions
	 *   published (boolean)     Whether the cirkulero has been published
	 *   note      (string|null) The reminder note for the cirkulero
	 * 
	 * Throws:
	 * See routers/api#performListQueryStatement
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const dbData = CRApi.performListQueryStatement({
		req: req,
		res: res,
		db: CR.db.cirkuleroj,
		table: 'cirkuleroj',
		colsAllowed: [
			'id',
			'name',
			'deadline',
			'open',
			'published',
			'note'
		]
	});

	if (!dbData) { return; }

	const output = dbData.data.map(row => {
		const rowOutput = {};
		for (let col of dbData.select) {
			const val = row[col];

			if (col === 'open' || col === 'published') {
				rowOutput[col] = !!val;

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

export default list;
