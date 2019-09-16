async function index (req, res, next) { // eslint-disable-line no-unused-vars
	const data = {
		title: 'Reta voĉdonado',
		scripts: [
			'/js/cr/main/vochdonado/retaj.js',
		]
	};

	await res.sendRegularPage('vochdonado/retaj', data);
}

export default index;
