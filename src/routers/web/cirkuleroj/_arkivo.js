async function arkivo (req, res, next) {
	const pageDataObj = {
		cirkuleroj: {},
		mayContribute: false // TODO: Fetch this dynamically
	};

	let stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, `open`, published from cirkuleroj where open = 1 or published = 1');
	let rows = stmt.all();
	for (let row of rows) {
		pageDataObj.cirkuleroj[row.id] = {
			id: row.id,
			archive: false,
			name: row.name,
			deadline: row.deadline,
			open: row.open,
			published: row.published
		};
	}

	stmt = CR.db.cirkuleroj.prepare('select id, name from cirkuleroj_arkivo');
	rows = stmt.all();
	for (let row of rows) {
		pageDataObj.cirkuleroj[row.id] = {
			id: row.id,
			archive: true,
			name: row.name
		};
	}

	const data = {
		title: 'Cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/arkivo.js',
			'/plugins/momentjs/moment.min.js'
		],
		pageDataObj: pageDataObj
	};
	await res.sendRegularPage('cirkuleroj/arkivo', data);
}

export default arkivo;
