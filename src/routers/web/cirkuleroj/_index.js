import Group from '../../../api/group';

async function index (req, res, next) {
	const pageDataObj = {};
	if (req.user && req.user.hasPermission('cirkuleroj.manage')) {
		const allGroups = await Group.getAllGroups();
		const groups = [];
		for (let group of allGroups.values()) {
			let name = group.nameBase;
			if (!group.membersAllowed) { name += ' (ĉiuj)'; }

			groups.push({
				id: group.id,
				name: name
			});
		}
		pageDataObj.groups = groups;
	}

	const data = {
		title: 'Cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/main.js',
			'/plugins/typeahead/typeahead.js',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.min.js',
			'/plugins/momentjs/moment.min.js',
			'/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js'
		],
		stylesheets: [
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput-typeahead.css',
			'/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css'
		],
		permissionsCheck: [
			'cirkuleroj.manage'
		],
		pageDataObj: pageDataObj
	};
	await res.sendRegularPage('cirkuleroj/index', data);
}

export default index;
