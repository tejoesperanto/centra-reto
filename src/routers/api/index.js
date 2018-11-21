import express from 'express';

import user from './user';

export function init () {
	const router = express.Router();

	router.use('/user', user());

	return router;
}

export function sendError (res, err, info = []) {
	res.json({
		success: false,
		error: err,
		info: info
	});
}

export function sendResponse (res, obj = {}) {
	obj.success = true;
	res.json(obj);
}

export function handleRequiredFields (req, res, fields) {
	for (let field of fields) {
		if (!(field in req.body)) {
			sendError(res, 'MISSING_ARGUMENT', [field]);
			return false;
		}
	}
	return true;
}
