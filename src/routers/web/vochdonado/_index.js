async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const data = {
		title: 'Voĉdonado'
	};

	await res.sendRegularPage('vochdonado/index', data);
}

export default index;
