async function listo (req, res, next) {
	const pageDataObj = {
		resource: {}
	};

	let stmt = CR.db.rekursoj.prepare('select id, name, description, url from resource');
	let rows = stmt.all();
	for (let row of rows) {
		pageDataObj.resource[row.id] = {
			id: row.id,
			name: row.name,
			description: row.description,
			url: row.url
		};
	}

	const data = {
		title: 'Eksteraj rekursoj',
		scripts: [
			'/js/cr/main/rekursoj/listo.js'
		],
		pageDataObj: pageDataObj
	};
	await res.sendRegularPage('rekursoj/listo', data);
}

export default listo;
