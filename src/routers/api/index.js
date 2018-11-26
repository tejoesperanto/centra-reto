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

/**
 * Express middleware that sends an API error if the user hasn't logged in
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export function requireLogin (req, res, next) {
	if (req.user) {
		next();
	} else {
		sendError(res, 'NOT_LOGGED_IN');
	}
}

/**
 * Express middleware that sends an API error if the user hasn't completed initial setup
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export function requireInitialSetup (req, res, next) {
	if (req.user.hasCompletedInitialSetup()) {
		next();
	} else {
		sendError(res, 'INITIAL_SETUP_REQUIRED');
	}
}

/**
 * Generates a safe select statement with user provided values
 * @param  {Express.Request}  req
 * @param  {Express.Response} res
 * @param  {string}           table       The table to select from, optionally with a join statement
 * @param  {string[]}         colsSelect  The cols to select
 * @param  {string[]}         colsAllowed The cols the user is allowed to do anything with
 * @return {Object|null} `{ stmt, input }`
 * 
 * `req` body parameters:
 * [offset]    (number)   The offset of the rows to return.
 *                        Defaults to 0.
 * limit       (number)   The limit of the rows to return.
 *                        Value: 1-100
 * [where]     (Object[]) The values to require. `{ col, val, type }`.
 *                        Type can be any of `=`, `like`.
 * [search]    (Object[]) Just like `where` except cols are conbined using the or operator. The `like` operator is always used `{ col, val }`.
 * order_col   (string)   The column to order by.
 * [order_asc] (boolean)  True for ascending order, false for descending order.
 *                        Defaults to true.
 *
 * Throws:
 * MISSING_ARGUMENT      [argument]
 * INVALID_ARGUMENT      [argument]
 * INVALID_WHERE_COLUMN  [column]
 * INVALID_SEARCH_COLUMN [column]
 */
export function generateListQueryStatement (req, res, table, colsSelect, colsAllowed) {
	const requiredFields = [
		'limit',
		'order_col'
	];
	if (!handleRequiredFields(req, res, requiredFields)) { return null; }

	const escapeCol = c => '`' + c + '`';
	const colsSelectEsc  = colsSelect.map(escapeCol);
	const colsAllowedEsc = colsAllowed.map(escapeCol);

	const inputData = [];
	const allowedWhereTypes = ['=', 'like'];
	const allowedWhereValues = ['number', 'string'];

	let stmt = 'select ';
	for (let col of colsSelectEsc) {
		stmt += col + ',';
	}
	stmt = stmt.slice(0, -1);

	stmt += ' from ' + table;

	if (req.body.where && !(req.body.where instanceof Array)) {
		sendError(res, 'INVALID_ARGUMENT', ['where']);
		return null;
	}
	if (req.body.search && !(req.body.search instanceof Array)) {
		sendError(res, 'INVALID_ARGUMENT', ['search']);
		return null;
	}

	if ((req.body.where  && req.body.where.length  > 0) ||
		(req.body.search && req.body.search.length > 0)) {
		stmt += ' where';
	}

	let first = true;
	if (req.body.where && req.body.where.length > 0) {
		stmt += '(';
		for (let whereData of req.body.where) {
			if (typeof whereData !== 'object') {
				sendError(res, 'INVALID_WHERE_COLUMN', [whereData]);
				return null;
			}
			const i = colsAllowed.indexOf(whereData.col);
			if (!('col' in whereData) ||
				i === -1 ||
				!('val' in whereData) ||
				!('type' in whereData) ||
				allowedWhereTypes.indexOf(whereData.type) === -1) {
				sendError(res, 'INVALID_WHERE_COLUMN', [whereData]);
				return null;
			}

			if (typeof whereData.val === 'boolean') {
				whereData.val = +whereData.val; // cast to number
			}
			if (allowedWhereValues.indexOf(typeof whereData.val) === -1) {
				sendError(res, 'INVALID_WHERE_COLUMN', [whereData]);
				return null;
			}
			
			if (!first) {
				stmt += ' and';
			}
			stmt += ` ${colsAllowedEsc[i]} ${whereData.type} ?`;
			inputData.push(whereData.val);
			first = false;
		}
		stmt += ')';
	}
	
	if (req.body.search && req.body.search.length > 0) {
		if (!first) { stmt += ' and '; }
		first = true;
		stmt += '(';
		for (let searchData of req.body.search) {
			if (typeof searchData !== 'object') {
				sendError(res, 'INVALID_SEARCH_COLUMN', [searchData]);
				return null;
			}
			const i = colsAllowed.indexOf(searchData.col);
			if (!('col' in searchData) ||
				i === -1 ||
				!('val' in searchData)) {
				sendError(res, 'INVALID_SEARCH_COLUMN', [searchData]);
				return null;
			}

			if (typeof searchData.val === 'boolean') {
				searchData.val = +searchData.val; // cast to number
			}
			if (allowedWhereValues.indexOf(typeof searchData.val) === -1) {
				sendError(res, 'INVALID_SEARCH_COLUMN', [searchData]);
				return null;
			}
			
			if (!first) {
				stmt += ' or';
			}
			stmt += ` ${colsAllowedEsc[i]} like ?`;
			inputData.push(searchData.val);
			first = false;
		}
		stmt += ')';
	}

	if (colsAllowed.indexOf(req.body.order_col) === -1) {
		sendError(res, 'INVALID_ARGUMENT', ['order_col']);
		return null;
	}
	stmt += ' order by ' + escapeCol(req.body.order_col);

	let orderMethod = 'ASC';
	if (req.body.order_asc !== undefined) {
		orderMethod = req.body.order_asc ? 'ASC' : 'DESC';
	}
	stmt += ' ' + orderMethod;

	if (!Number.isSafeInteger(req.body.limit)) {
		sendError(res, 'INVALID_ARGUMENT', ['limit']);
		return null;
	}
	stmt += ' limit ' + req.body.limit;

	if (req.body.offset) {
		if (!Number.isSafeInteger(req.body.offset)) {
			sendError(res, 'INVALID_ARGUMENT', ['offset']);
			return null;
		}
		stmt += ' offset ' + req.body.offset;
	}

	return { stmt: stmt, input: inputData };
}
