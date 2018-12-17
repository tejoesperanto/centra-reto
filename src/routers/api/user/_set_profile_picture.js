import fs from 'pn/fs';
import * as Canvas from 'canvas';

import User from '../../../api/user';

async function set_profile_picture (req, res, next) {
	/**
	 * POST /set_profile_picture
	 * Changes the user's profile picture
	 *
	 * Multipart required
	 * json      - The JSON parameters
	 * [picture] - The picture. Must not be any bigger than 3MB, png or jpg recommended.
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Parameters:
	 * public (boolean) Whether the picture should be public
	 *
	 * Throws:
	 * NO_PICTURE                  No picture was provided and the user doesn't already have a picture
	 * BAD_PICTURE                 The provided image could not be loaded
	 * INVALID_ARGUMENT [argument]
	 */

	const fields = [
		'public'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.public !== 'boolean') {
		res.sendAPIError('INVALID_ARGUMENT', ['public']);
		return;
	}

	if (!req.user.hasPicture() && !req.file) {
		res.sendAPIError('NO_PICTURE');
		return;
	}
	// END DATA VALIDATION

	if (req.file) {
		let img;
		try {
			img = await Canvas.loadImage(req.file.path);
		} catch (e) {
			res.sendAPIError('BAD_PICTURE');
			return;
		}

		const picture = [];
		const sizes = User.getPictureSizes();
		for (let size of sizes) {
			const canvas = Canvas.createCanvas(size, size);
			const ctx = canvas.getContext('2d');
			const hRatio = canvas.width / img.width;
			const vRatio = canvas.height / img.height;
			const ratio = Math.max(hRatio, vRatio);
			const centerShiftX = (canvas.width  - img.width  * ratio) / 2;
			const centerShiftY = (canvas.height - img.height * ratio) / 2;
			ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);

			picture.push(canvas.toBuffer('image/png'));
		}

		const paramsFields = sizes.map(x => 'size_' + x).join(',');
		const paramsValues = '?,'.repeat(sizes.length).slice(0, -1);
		const stmt = CR.db.users.prepare(`insert or replace into users_pictures (user_id, public, ${paramsFields}) values (@user_id, @public, ${paramsValues})`);
		stmt.run({
			user_id: req.user.id,
			public: +req.body.public
		}, picture);

	} else {
		const stmt = CR.db.users.prepare('update users_pictures set public = ? where user_id = ?');
		stmt.run(+req.body.public, req.user.id);
	}

	res.sendAPIResponse();

	if (req.file) {
		await fs.unlink(req.file.path);
	}
}

export default set_profile_picture;
