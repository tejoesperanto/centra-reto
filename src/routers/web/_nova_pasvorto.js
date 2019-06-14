import User from '../../api/user';

async function nova_pasvorto (req, res, next) { // eslint-disable-line no-unused-vars
	if (req.user) {
		res.redirect(303, '/');
		return;
	}

	if (req.params.email && req.params.resetKey) {
		const user = User.getUserByEmail(req.params.email);
		if (!user) { next(); return; }

		const stmt = CR.db.users.prepare('select 1 from users_password_reset where user_id = ? and key = ?');
		const row = stmt.get(user.id, req.params.resetKey);
		if (!row) { next(); return; }

		await res.sendFullPage('nova_pasvorto_krei', {
			email: req.params.email,
			key: req.params.resetKey
		});
	} else {
		await res.sendFullPage('nova_pasvorto_sendi');
	}
}

export default nova_pasvorto;
