import * as CRVote from '../../../api/vote';

async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const votes = await CRVote.getUserVotes(req.user);

	const data = {
		title: 'Reta voĉdonado',
		scripts: [
			'/js/cr/main/vochdonado/retaj.js',
		],
		page: {
			votes: votes
		}
	};

	await res.sendRegularPage('vochdonado/retaj', data);
}

export default index;
