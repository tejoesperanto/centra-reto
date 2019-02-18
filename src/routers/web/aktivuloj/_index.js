import Group from '../../../api/group';

async function index (req, res, next) {
	const allGroups = await Group.getAllGroups();
	const searchableGroups = [];
	for (let group of allGroups.values()) {
		if (!group.searchable) { continue; }
		searchableGroups.push({
			id: group.id,
			name: group.nameBase
		});
	}

	const data = {
		title: 'Aktivuloj',
		stylesheets: [
			'/plugins/bootstrap-select/css/bootstrap-select.min.css'
		],
		scripts: [
			'/plugins/url-search-params-0.1.2/min.js',
			'/plugins/bootstrap-select/js/bootstrap-select.min.js',
			'/js/bootstrap-select.eo.js',
			'/js/cr/main/aktivuloj/index.js'
		],
		page: {
			groups: searchableGroups
		}
	};

	await res.sendRegularPage('aktivuloj/index', data);
}

export default index;
