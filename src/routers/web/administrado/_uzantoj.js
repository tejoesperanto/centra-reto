import Group from '../../../api/group';

async function administrado_uzantoj (req, res, next) {
	if (!await req.requirePermissions('users.view')) { return; }

	const allGroups = await Group.getAllGroups();
	const groups = [];
	for (let group of allGroups.values()) {
		if (!group.membersAllowed) { continue; }
		groups.push({
			id: group.id,
			nameBase: group.nameBase,
			nameDisplay: group.nameDisplay,
			args: group.args
		});
	}

	const data = {
		title: 'Administrado de uzantoj',
		scripts: [
			'/js/cr/main/administrado/uzantoj.js',
			'/plugins/jquery-datatable/datatables.min.js',
			'/js/jquery.dataTables.eo.js',
			'/plugins/typeahead/typeahead.js',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.min.js'
		],
		stylesheets: [
			'/plugins/jquery-datatable/datatables.min.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput-typeahead.css'
		],
		permissionsCheck: [
			'users.modify', 'users.create', 'users.delete'
		],
		pageDataObj: {
			groups: groups
		}
	};
	await res.sendRegularPage('administrado/uzantoj', data);
}

export default administrado_uzantoj;
