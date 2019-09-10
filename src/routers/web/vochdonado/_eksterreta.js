async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const data = {
		title: 'TEJO-Voĉo'
	};

	await res.sendRegularPage('vochdonado/eksterreta', data);
}

export default index;
