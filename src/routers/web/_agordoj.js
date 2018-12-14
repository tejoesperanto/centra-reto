async function agordoj (req, res, next) {
	const data = {
		title: 'Agordoj',
		scripts: [
			'/js/cr/agordoj.js',
			'/plugins/jquery-validation/jquery.validate.js',
			'/js/jquery.validate.eo.js'
		]
	};
	await res.sendRegularPage('agordoj', data);
}

export default agordoj;
