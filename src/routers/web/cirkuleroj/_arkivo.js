async function arkivo (req, res, next) {
	// Determine whether the user is allowed to contribute to cirkuleroj
	let mayContribute = false;
	if (req.user) { mayContribute = await req.user.mayContributeToCirkuleroj(); }

	const pageDataObj = {
		cirkuleroj: {},
		mayContribute: mayContribute
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
			'/js/cr/main/cirkuleroj/arkivo.js'
		],
		pageDataObj: pageDataObj
	};
	await res.sendRegularPage('cirkuleroj/arkivo', data);
}

export default arkivo;
