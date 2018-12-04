import Group from '../../../api/group';

async function index (req, res, next) {
	const pageDataObj = {
		cirkuleroj: {},
		mayContribute: false // TODO: Fetch this dynamically
	};

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

	let stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, `open`, published from cirkuleroj');
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
			'/js/cr/main/cirkuleroj/main.js',
			'/plugins/typeahead/typeahead.js',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.min.js',
			'/plugins/momentjs/moment.min.js',
			'/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
			'/plugins/autosize/autosize.min.js'
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
