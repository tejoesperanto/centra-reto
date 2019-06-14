async function listo (req, res, next) { // eslint-disable-line no-unused-vars
	const pageDataObj = {
		resource: []
	};

	let stmt = CR.db.resources.prepare('select id, name, description, url from resource');
	let rows = stmt.all();
	for (let row of rows) {
		pageDataObj.resource.push({
			id: row.id,
			name: row.name,
			description: row.description,
			url: row.url
		});
	}

	const data = {
		title: 'Eksteraj resursoj',
		scripts: [
			'/js/cr/main/resursoj/listo.js'
		],
		pageDataObj: pageDataObj
	};
	await res.sendRegularPage('resursoj/listo', data);
}

export default listo;
