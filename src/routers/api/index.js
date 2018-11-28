import express from 'express';

import user from './user';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export function init () {
	const router = express.Router();

	// Middleware for this router only
	router.use(middlewareSendAPIError);
	router.use(middlewareSendAPIResponse);
	router.use(middlewareHandleRequiredFields);
	router.use(middlewareRequirePermissions);

	// Routing
	router.use('/user', user());

	return router;
}

function middlewareSendAPIError (req, res, next) {
	/**
	 * Express middleware to send an API error
	 * @param  {string} err    The API error code
	 * @param  {Array}  [info] An info array adding detail to the error
	 */
	res.sendAPIError = function sendAPIError (err, info = []) {
		res.json({
			success: false,
			error: err,
			info: info
		});
	};
	next();
}

function middlewareSendAPIResponse (req, res, next) {
	/**
	 * Express middleware to send an API response
	 * @param  {Object} obj The response object to send
	 */
	res.sendAPIResponse = function sendAPIResponse (obj = {}) {
		obj.success = true;
		res.json(obj);
	};
	next();
}

function middlewareHandleRequiredFields (req, res, next) {
	/**
	 * Express middleware to ensure that the request contains all the needed parameters in `req.body`.
	 * If not, an error is sent as response and false is returned. Otherwise returns true.
	 * 
	 * @param  {string[]} fields An array of required parameters
	 * @return {boolean} Whether all required fields are present
	 */
	req.handleRequiredFields = function handleRequiredFields (fields) {
		for (let field of fields) {
			if (!(field in req.body)) {
				res.sendAPIError('MISSING_ARGUMENT', [field]);
				return false;
			}
		}
		return true;
	};
	next();
}

function middlewareRequirePermissions (req, res, next) {
	/**
	 * Express middleware to ensure that the user has a set of permissions.
	 * If not, an error is sent as response and false is returned. Otherwise returns true.
	 * 
	 * @param  {...string} perms The permissions to check
	 * @return {boolean} Whether all required permissions are present
	 */
	req.requirePermissions = async function requirePermissions (...perms) {
		for (let perm of perms) {
			if (!await req.user.hasPermission(perm)) {
				res.sendAPIError('MISSING_PERMISSION', [perm]);
				return false;
			}
		}
		return true;
	};
	next();
}

export const middleware = {
	/**
	 * Express middleware that sends an API error if the user hasn't logged in
	 * @param  {express.Request}  req
	 * @param  {express.Response} res
	 * @param  {Function}         next
	 */
	requireLogin: function middlewareRequireLogin (req, res, next) {
		if (req.user) {
			next();
		} else {
			res.sendAPIError('NOT_LOGGED_IN');
		}
	},

	/**
	 * Express middleware that sends an API error if the user hasn't completed initial setup
	 * @param  {express.Request}  req
	 * @param  {express.Response} res
	 * @param  {Function}         next
	 */
	requireInitialSetup: function middlewareRequireInitialSetup (req, res, next) {
		if (!req.user || req.user.hasCompletedInitialSetup()) {
			next();
		} else {
			res.sendAPIError('INITIAL_SETUP_REQUIRED');
		}
	}
};

/**
 * Perform a safe select statement with user provided values
 * @param  {Express.Request}        req
 * @param  {Express.Response}       res
 * @param  {BetterSqlite3.Database} db
 * @param  {string}                 table       The table to select from, optionally with a join statement
 * @param  {string[]}               colsSelect  The cols to select
 * @param  {string[]}               colsAllowed The cols the user is allowed to do anything with
 * @return {Object|null} `{ data, rowsTotal, rowsFiltered }`
 * 
 * `req` body parameters:
 * [offset]    (number)   The offset of the rows to return.
 *                        Defaults to 0.
 * limit       (number)   The limit of the rows to return.
 *                        Value: 1-100
 * [where]     (Object[]) The values to require. `{ col, val, type }`.
 *                        Type can be any of `=`, `like`.
 * [search]    (Object[]) Just like `where` except cols are combined using the or operator. The `like` operator is always used `{ col, val }`.
 * order       (Object[]) The columns to order by in the provided order. `{ col, type }`
 *                        Type can be any of 'asc', 'desc'.
 *
 * Throws:
 * MISSING_ARGUMENT      [argument]
 * INVALID_ARGUMENT      [argument]
 * INVALID_WHERE_COLUMN  [column]
 * INVALID_SEARCH_COLUMN [column]
 * INVALID_ORDER_COLUMN  [column]
 */
export function performListQueryStatement (req, res, db, table, colsSelect, colsAllowed) {
	const requiredFields = [
		'limit'
	];
	if (!req.handleRequiredFields(requiredFields)) { return null; }

	const escapeCol = c => '`' + c + '`';
	const colsSelectEsc  = colsSelect.map(escapeCol);
	const colsAllowedEsc = colsAllowed.map(escapeCol);

	const inputData = [];
	const allowedWhereTypes = ['=', 'like'];
	const allowedWhereValues = ['number', 'string'];
	const allowedOrderTypes = ['asc', 'desc'];

	let stmt = 'select ';
	for (let col of colsSelectEsc) {
		stmt += col + ',';
	}
	stmt = stmt.slice(0, -1);

	let stmtNoLimit = '';
	let stmtNoLimitStartIndex = stmt.length;

	stmt += ' from ' + table;

	if (req.body.where && !(req.body.where instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['where']);
		return null;
	}
	if (req.body.search && !(req.body.search instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['search']);
		return null;
	}
	if (req.body.order && !(req.body.order instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['order']);
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
				res.sendAPIError('INVALID_WHERE_COLUMN', [whereData]);
				return null;
			}
			const i = colsAllowed.indexOf(whereData.col);
			if (!('col' in whereData) ||
				i === -1 ||
				!('val' in whereData) ||
				!('type' in whereData) ||
				allowedWhereTypes.indexOf(whereData.type) === -1) {
				res.sendAPIError('INVALID_WHERE_COLUMN', [whereData]);
				return null;
			}

			if (typeof whereData.val === 'boolean') {
				whereData.val = +whereData.val; // cast to number
			}
			if (allowedWhereValues.indexOf(typeof whereData.val) === -1) {
				res.sendAPIError('INVALID_WHERE_COLUMN', [whereData]);
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
				res.sendAPIError('INVALID_SEARCH_COLUMN', [searchData]);
				return null;
			}
			const i = colsAllowed.indexOf(searchData.col);
			if (!('col' in searchData) ||
				i === -1 ||
				!('val' in searchData)) {
				res.sendAPIError('INVALID_SEARCH_COLUMN', [searchData]);
				return null;
			}

			if (typeof searchData.val === 'boolean') {
				searchData.val = +searchData.val; // cast to number
			}
			if (allowedWhereValues.indexOf(typeof searchData.val) === -1) {
				res.sendAPIError('INVALID_SEARCH_COLUMN', [searchData]);
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

	stmtNoLimit = stmt;

	if (req.body.order && req.body.order.length > 0) {
		stmt += ' order by';

		for (let orderData of req.body.order) {
			if (typeof orderData !== 'object') {
				res.sendAPIError('INVALID_ORDER_COLUMN', [orderData]);
				return null;
			}
			const i = colsAllowed.indexOf(orderData.col);
			if (!('col' in orderData) ||
				i === -1 ||
				!('type' in orderData) ||
				allowedOrderTypes.indexOf(orderData.type.toLowerCase()) === -1) {
				res.sendAPIError('INVALID_ORDER_COLUMN', [orderData]);
				return null;
			}

			stmt += ` ${colsAllowedEsc[i]} ${orderData.type}`;
		}
	}

	if (!Number.isSafeInteger(req.body.limit)) {
		res.sendAPIError('INVALID_ARGUMENT', ['limit']);
		return null;
	}
	stmt += ' limit ' + req.body.limit;

	if (req.body.offset) {
		if (!Number.isSafeInteger(req.body.offset)) {
			res.sendAPIError('INVALID_ARGUMENT', ['offset']);
			return null;
		}
		stmt += ' offset ' + req.body.offset;
	}

	const data = db.prepare(stmt).all(...inputData);

	const rowsTotal = db.prepare('select count(1) as count from ' + table).get().count;

	stmtNoLimit = 'select count(1) as count' + stmtNoLimit.substr(stmtNoLimitStartIndex);
	const rowsFiltered = db.prepare(stmtNoLimit).get(...inputData).count;

	return { data: data, rowsTotal: rowsTotal, rowsFiltered: rowsFiltered };
}
