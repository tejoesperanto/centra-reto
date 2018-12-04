import Group from '../../../api/group';

async function arkivo (req, res, next) {
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

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

	const data = {
		title: 'Cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/agordoj.js',
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
		pageDataObj: {
			groups
		}
	};
	await res.sendRegularPage('cirkuleroj/agordoj', data);
}

export default arkivo;
