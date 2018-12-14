import User from '../../api/user';

async function aktivuloImage (req, res, next) {
	const mustBePublic = !req.user;

	const user = User.getUserByEmail(req.params.email);
	if (!user || !user.hasPicture(mustBePublic)) {
		next();
		return;
	}

	const sizes = User.getPictureSizes();

	const size = parseInt(req.params.size, 10);
	if (!size || sizes.indexOf(size) === -1) {
		next();
		return;
	}

	const stmt = CR.db.users.prepare(`select \`size_${size}\` as \`img\` from users_pictures where user_id = ?`);
	const img = stmt.get(user.id).img;

	res.set('Content-Type', 'image/png');
	res.send(img);
}

export default aktivuloImage;
