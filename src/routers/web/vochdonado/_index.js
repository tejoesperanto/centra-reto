async function index (req, res, next) {
	const data = {
		title: 'Voĉdonado'
	};

	await res.sendRegularPage('vochdonado/index', data);
}

export default index;
