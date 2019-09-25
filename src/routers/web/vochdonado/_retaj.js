import * as CRVote from '../../../api/vote';
import Group from '../../../api/group';

async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const votes = await CRVote.getUserVotes(req.user);
	for (let vote of votes) {
		vote.usersNotVotedNames = vote.usersNotVoted.map(u => u.getLongName() || u.email);
	}

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
		title: 'Reta voĉdonado',
		scripts: [
			'/js/cr/main/vochdonado/retaj.js',
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
		page: {
			votes
		},
		pageDataObj: {
			groups
		},
		permissionsCheck: [
			'votes.manage'
		],
	};

	await res.sendRegularPage('vochdonado/retaj', data);
}

export default index;
