async function administrado_uzantoj (req, res, next) {
	if (!await req.requirePermissions('users.view')) { return; }

	const data = {
		title: 'Administrado de uzantoj',
		scripts: [
			'/js/cr/main/administrado/uzantoj.js',
			'/plugins/jquery-datatable/jquery.dataTables.js',
			'/js/jquery.dataTables.eo.js',
			'/plugins/jquery-datatable/skin/bootstrap/js/dataTables.bootstrap.min.js'
		],
		stylesheets: [
			'/plugins/jquery-datatable/skin/bootstrap/css/dataTables.bootstrap.min.css'
		]
	};
	await res.sendRegularPage('administrado/uzantoj', data);
}

export default administrado_uzantoj;
