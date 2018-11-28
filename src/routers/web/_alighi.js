async function alighi (req, res, next) {
	// If the user is currently logged in, log them out
	if (req.user) {
		req.logout();
	}

	// Verify the params
	let stmt = CR.db.users.prepare("select id from users where email = ? and activation_key = ? and enabled = 1");
	let row = stmt.get(req.params.email, req.params.activationKey);
	if (!row) {
		await res.sendErrorPage(401, 'Aliĝŝlosilo ne valida');
		return;
	}

	const data = {
		page: {
			email: req.params.email,
			activation_key: req.params.activationKey
		}
	};
	await res.sendFullPage('alighi', data);
}

export default alighi;
