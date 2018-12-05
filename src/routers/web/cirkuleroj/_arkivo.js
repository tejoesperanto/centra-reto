async function arkivo (req, res, next) {
	// Determine whether the user is allowed to contribute to cirkuleroj
	let stmt = CR.db.cirkuleroj.prepare('select purpose, groups from groups');
	let rows = stmt.all();

	let mayContribute = false;
	if (req.user) {
		const userGroups = await req.user.getGroups();

		for (let row of rows) {
			const groupIds = row.groups.split(',').map(x => parseInt(x, 10));

			for (let id of groupIds) {
				if (userGroups.has(id)) {
					mayContribute = true;
					break;
				}
			}
		}
	}

	const pageDataObj = {
		cirkuleroj: {},
		mayContribute: mayContribute
	};

	stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, `open`, published from cirkuleroj where open = 1 or published = 1');
	rows = stmt.all();
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
