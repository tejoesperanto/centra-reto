import * as cirkulero from '../../../api/cirkulero';

async function pretigi (req, res, next) {
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }
	
	const id = parseInt(req.params.id, 10);
	if (!Number.isSafeInteger(id)) {
		next(); // 404
		return;
	}

	// Try to find the cirkulero
	const stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, open, published from cirkuleroj where id = ? and published = 0');
	const row = stmt.get(id);

	if (!row) {
		next(); // 404
		return;
	}

	const data = {
		title: `Pretigi cirkuleron n-ro ${row.id} por ${row.name}`,
		scripts: [
			'/plugins/chartjs/Chart.bundle.min.js',
			'/js/cr/main/cirkuleroj/cirkulero.js'
		],
		page: {
			cirkulero: row,
			editor: true
		},
		pageDataObj: {
			cirkulero: row,
			editor: true,
			groups: await cirkulero.getGroups()
		}
	};
	await res.sendRegularPage('cirkuleroj/cirkulero', data);
}

export default pretigi;
