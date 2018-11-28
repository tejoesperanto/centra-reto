async function index (req, res, next) {
	if (!req.user || req.user.hasCompletedInitialSetup()) {
		// For visitors not logged in and those who have completed the initial setup
		const data = {
			title: 'Hejmo'
		};
		await res.sendRegularPage('index', data);
	} else {
		// For logged in users that haven't completed the initial setup
		await res.sendFullPage('initial_setup');
	}
}

export default index;
