async function index (req, res, next) {
	const data = {
		title: 'Aktivuloj',
		scripts: [
			'/plugins/url-search-params-0.1.2/min.js',
			'/js/cr/main/aktivuloj/index.js'
		]
	};

	await res.sendRegularPage('aktivuloj/index', data);
}

export default index;
