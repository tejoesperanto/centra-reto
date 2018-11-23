import express from 'express';
import Mustache from 'mustache';
import fs from 'pn/fs';
import path from 'path';
import moment from 'moment-timezone';

import { wrap, requireInitialSetup } from '.';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export function init () {
	const router = express.Router();

	// TODO:
	// /novapasvorto
	// /kondichoj
	// /uzanto/:email
	// /agordoj

	// Handle regular pages
	router.get('/', wrap(mixedPageIndex));

	// Handle full pages
	router.get('/alighi/:email/:activationKey', wrap(fullPageAlighi));
	router.get('/ensaluti', wrap(fullPageEnsaluti));

	return router;
}

// Utility functions
/**
 * Sends an error page as response
 * @param  {number}           code The http status code
 * @param  {string}           msg  The error message
 * @param  {express.Request}  req
 * @param  {express.Response} res
 */
async function showError (code, msg, req, res) {
	await sendFullPage(req, res, 'error', {
		error_code: code,
		error_message: msg
	});
}

/**
 * Renders a template from a file with the provided view
 * @param  {string} file The path to the file
 * @param  {Object} view The render view
 * @return {string} The rendered template
 */
async function renderTemplate (file, view) {
	if (!CR.cacheEnabled) {
		Mustache.clearCache();
	}

	const template = await fs.readFile(file, 'utf8');
	const render = Mustache.render(template, view);

	return render;
}

/**
 * Renders a template from a file with the provided view and sends it as a response
 * @param  {express.Response} res
 * @param  {string}           file The path to the file
 * @param  {Object}           view The render view
 */
async function sendTemplate (res, file, view) {
	const render = await renderTemplate(file, view);
	res.send(render);
}

/**
 * Adds global view parameters to a view
 * @param  {express.Request} req
 * @param  {Object}          view The view to amend
 */
function amendView (req, view) {
	if (!view) { return; }
	view.year = moment().format('YYYY');
	view.version = CR.version;
	if (req.user) {
		view.user = {
			email: req.user.email,
			longName: req.user.getLongName(),
			shortName: req.user.getShortName(),
			briefName: req.user.getBriefName(),
			details: req.user.getNameDetails()
		};
	} else {
		view.user = false;
	}
}

/**
 * Renders a regular page
 * @param  {string} page The template name. note: This is not the path, it's a name like `index`
 * @param  {Object} data The outer view with an inner object under `page` containing the inner view
 * @return {string} The rendered page
 */
async function renderRegularPage (page, data) {
	const innerPath = path.join(CR.filesDir, 'web', 'templates_page', page + '.html');
	const inner = await renderTemplate(innerPath, data);
	data.page = inner;
	const outer = await renderTemplate(path.join(CR.filesDir, 'web', 'page.html'), data);
	return outer;
}

/**
 * Renders a regular page and sends it as a response
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {string}           page The template name. Note: This is not the path, it's a name like `index`
 * @param  {Object}           data The outer view with an inner object under `page` containing the inner view
 * @return {string} The rendered page
 */
async function sendRegularPage (req, res, page, data = {}) {
	amendView(req, data);
	const render = await renderRegularPage(page, data);
	res.send(render);
}

/**
 * Renders a full page and sends it as a response
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {string}           page The template name. Note: This is not the path, it's a name like `index`
 * @param  {Object}           view The view
 * @return {string} The rendered page
 */
function sendFullPage (req, res, page, view = {}) {
	amendView(req, view);
	const file = path.join(CR.filesDir, 'web', 'templates_full', page + '.html');
	return sendTemplate(res, file, view);
}

// Handlers
// Errors
/**
 * Handles an HTTP 404 error. The function signature is designed to fit the express 404 function signature requirement
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export function error404 (req, res, next) {
	res.status(404);
	showError(404, 'Paĝo ne trovita', req, res);
}

/**
 * Handles an HTTP 500 error. The function signature is designed to fit the express 500 function signature requirement
 * @param  {Object}           err
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export function error500 (err, req, res, next) {
	CR.log.error(`Okazis eraro ĉe ${req.method} ${req.originalUrl}\n${err.stack}`);
	res.status(500);
	showError(500, 'Okazis interna eraro', req, res);
}

// Mixed pages
async function mixedPageIndex (req, res, next) {
	if (!req.user || req.user.hasCompletedInitialSetup()) {
		// For visitors not logged in and those who have completed the initial setup
		const data = {
			title: 'Hejmo'
		};
		await sendRegularPage(req, res, 'index', data);
	} else {
		// For logged in users that haven't completed the initial setup
		const data = {

		};
		await sendFullPage(req, res, 'initial_setup', data);
	}
}

// Regular pages

// Full pages
async function fullPageAlighi (req, res, next) {
	// Verify the params
	let stmt = CR.db.users.prepare("select id from users where email = ? and activation_key = ?");
	let row = stmt.get(req.params.email, req.params.activationKey);
	if (!row) {
		showError(401, 'Aliĝŝlosilo ne valida', req, res);
		return;
	}

	const data = {
		page: {
			email: req.params.email,
			activation_key: req.params.activationKey
		}
	};
	await sendFullPage(req, res, 'alighi', data);
}

async function fullPageEnsaluti (req, res, next) {
	await sendFullPage(req, res, 'ensaluti');
}
