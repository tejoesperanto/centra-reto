async function index (req, res, next) {
	const data = {
		title: 'Cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/main.js'
		]
	};
	await res.sendRegularPage('cirkuleroj/index', data);
}

export default index;
