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

	const stmt = CR.db.cirkuleroj.prepare('select key, value from settings where key in ("publish_message", "publish_email")');
	const settings = stmt.all();
	let publishMessage;
	let publishEmail;
	for (let setting of settings) {
		switch (setting.key) {
			case 'publish_message':
			publishMessage = setting.value;
			break;
			case 'publish_email':
			publishEmail = setting.value;
		}
	}

	const data = {
		title: 'Cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/agordoj.js',
			'/plugins/typeahead/typeahead.js',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.min.js',
			'/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
			'/plugins/autosize/autosize.min.js'
		],
		stylesheets: [
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput-typeahead.css',
			'/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css'
		],
		pageDataObj: {
			groups,
			publishMessage: publishMessage,
			publishEmail: publishEmail
		}
	};
	await res.sendRegularPage('cirkuleroj/agordoj', data);
}

export default arkivo;
