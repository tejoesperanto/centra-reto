import express from 'express';

import user from './user';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export function init () {
	const router = express.Router();

	router.use('/user', user());

	return router;
}

/**
 * Sends an API error
 * @param  {express.Response} res
 * @param  {string}           err    The API error code
 * @param  {Array}            [info] An info array adding detail to the error
 */
export function sendError (res, err, info = []) {
	res.json({
		success: false,
		error: err,
		info: info
	});
}

/**
 * Sends an API response
 * @param  {express.Response} res
 * @param  {Object}           obj The response object to send
 */
export function sendResponse (res, obj = {}) {
	obj.success = true;
	res.json(obj);
}

/**
 * Ensures that the request contains all the needed parameters (`req.body`).
 * If not, an error is sent as response and false is returned. Otherwise returns true.
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {string[]}         fields An array of required parameters
 * @return {boolean} Whether all required fields are present
 */
export function handleRequiredFields (req, res, fields) {
	for (let field of fields) {
		if (!(field in req.body)) {
			sendError(res, 'MISSING_ARGUMENT', [field]);
			return false;
		}
	}
	return true;
}
