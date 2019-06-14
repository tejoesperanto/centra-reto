async function index (req, res, next) {
	const data = {
		title: 'TEJO-Voĉo'
	};

	await res.sendRegularPage('vochdonado/eksterreta', data);
}

export default index;
