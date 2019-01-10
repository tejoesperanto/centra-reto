async function index (req, res, next) {
	const data = {
		title: 'Aktivuloj',
		scripts: [
			'/js/cr/main/aktivuloj/index.js'
		]
	};

	await res.sendRegularPage('aktivuloj/index', data);
}

export default index;
