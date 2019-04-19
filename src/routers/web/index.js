import express from 'express';
import Handlebars from 'handlebars';
import fs from 'pn/fs';
import path from 'path';
import moment from 'moment-timezone';

import * as CRApi from '../api';
import { wrap } from '..';

import * as CRUtil from '../../util';
const safeInlineJSONStringify = CRUtil.safeInlineJSONStringify;

import routerAdministrado from './administrado';
import routerAktivuloj from './aktivuloj';
import routerCirkuleroj from './cirkuleroj';
import routerResource from './resource';

import pageIndex from './_index';
import pageAgordoj from './_agordoj';
import pageAlighi from './_alighi';
import pageEnsaluti from './_ensaluti';
import pageKondichoj from './_kondichoj';
import pageNovaPasvorto from './_nova_pasvorto';

import dataAktivuloImage from './_aktivulo_image';

/**
 * Sets up the router
 * @return {express.Router} The router
 */
export function init () {
	const router = express.Router();
	
	// Middleware for this router only
	router.use(middlewareRequirePermissions);
	router.use(middlewareSendErrorPage);
	router.use(middlewareSendTemplate);
	router.use(middlewareSendRegularPage);
	router.use(middlewareSendFullPage);

	// Routing
	router.use('/administrado', routerAdministrado());
	router.use('/aktivuloj', routerAktivuloj());
	router.use('/cirkuleroj', routerCirkuleroj());
	router.use('/resursoj', routerResource());

	// Pages
	router.get('/',
		wrap(pageIndex));

	router.get('/agordoj',
		middleware.requireLogin,
		middleware.requireInitialSetup,
		wrap(pageAgordoj));

	router.get('/alighi/:email/:activationKey',
		wrap(pageAlighi));

	router.get('/ensaluti',
		wrap(pageEnsaluti));

	router.get([ '/novapasvorto', '/novapasvorto/:email/:resetKey' ],
		wrap(pageNovaPasvorto));

	router.get('/kondichoj',
		wrap(pageKondichoj));

	// Data
	router.get('/img/aktivulo/:email/:size',
		wrap(dataAktivuloImage));

	return router;
}

export const middleware = {
	/**
	 * Express middleware to redirect any requests to / from users that have not yet completed initial setup
	 */
	requireInitialSetup: function middlewareRequireInitialSetup (req, res, next) {
		if (req.user && !req.user.hasCompletedInitialSetup()) {
			res.redirect(303, '/');
		} else {
			next();
		}
	},

	/**
	 * Express middleware to redirect any requests to / from users that haven't logged in
	 */
	requireLogin: function middlewareRequireLogin (req, res, next) {
		if (req.user) {
			next();
		} else {
			res.redirect(303, '/ensaluti?' + req.originalUrl);
		}
	}
};

function middlewareRequirePermissions (req, res, next) {
	/**
	 * Express middleware to redirect any requests from users without a given permission to /
	 * @param  {...string} perms The necessary permission
	 * @return {boolean} Whether all required permissions are present
	 */
	req.requirePermissions = async function requirePermissions (...perms) {
		for (let perm of perms) {
			if (!await req.user.hasPermission(perm)) {
				res.redirect(303, '/')
				return false;
			}
		}
		return true;
	};
	next();
}

function middlewareSendErrorPage (req, res, next) {
	/**
	 * Express middleware to send an error page as response
	 * @param {number} code The http status code
	 * @param {string} msg  The error message
	 */
	res.sendErrorPage = async function sendErrorPage (code, msg) {
		await res.sendFullPage('error', {
			error_code: code,
			error_message: msg
		});
	};
	next();
}

function middlewareSendTemplate (req, res, next) {
	/**
	 * Express middleware to render a template from a file with the provided view and send it
	 * @param {string} file The path to the file
	 * @param {Object} view The render view
	 */
	res.sendTemplate = async function sendTemplate (file, view) {
		const render = await CRUtil.renderFileTemplate(file, view);
		res.send(render);
	};
	next();
}

function middlewareSendRegularPage (req, res, next) {
	/**
	 * Express middleware to render a regular page and send it as a response
	 * @param  {string} page The template name. Note: This is not the path, it's a name like `index`
	 * @param  {Object} data The outer view with an inner object under `page` containing the inner view
	 * @return {string} The rendered page
	 */
	res.sendRegularPage = async function sendRegularPage (page, data = {}) {
		await amendView(req, data);
		const render = await renderRegularPage(page, data);
		res.send(render);
	};
	next();
}

function middlewareSendFullPage (req, res, next) {
	/**
	 * Express middleware to render a full page and send it as a response
	 * @param  {string} page The template name. Note: This is not the path, it's a name like `index`
	 * @param  {Object} view The view
	 * @return {string} The rendered page
	 */
	res.sendFullPage = async function sendFullPage (page, view = {}) {
		await amendView(req, view);
		const file = path.join(CR.filesDir, 'web', 'templates_full', page + '.html');
		await res.sendTemplate(file, view);
	};
	next();
}

/**
 * Renders a regular page
 * @param  {string} page The template name. note: This is not the path, it's a name like `index`
 * @param  {Object} data The outer view with an inner object under `page` containing the inner view
 * @return {string} The rendered page
 */
export async function renderRegularPage (page, data) {
	const innerPath = path.join(CR.filesDir, 'web', 'templates_page', page + '.html');
	const inner = await CRUtil.renderFileTemplate(innerPath, data);
	data.page = inner;
	const outer = await CRUtil.renderFileTemplate(path.join(CR.filesDir, 'web', 'page.html'), data);
	return outer;
}

/**
 * Handles an HTTP 404 error
 * @param {express.Request}  req
 * @param {express.Response} res
 * @param {Function}         next
 */
export async function handleError404 (req, res, next) {
	res.status(404);
	await res.sendErrorPage(404, 'Paĝo ne trovita');
}

/**
 * Handles an HTTP 500 error
 * @param {Object}           err
 * @param {express.Request}  req
 * @param {express.Response} res
 * @param {Function}         next
 */
export async function handleError500 (err, req, res, next) {
	// As csurf is initiated by http.js itself requests made to the API are sent here as well. For this reason they need to be handled in their own way
	if (err.code === 'EBADCSRFTOKEN') {
		CRApi.handleBadCSRF(req, res);
		return;
	}

	CR.log.error(`Okazis eraro ĉe ${req.method} ${req.originalUrl}\n${err.stack}`);
	if (res.headersSent) { return; }
	res.status(500);
	await res.sendErrorPage(500, 'Okazis interna eraro');
}

/**
 * Adds global view parameters to a view
 * @param {express.Request} req
 * @param {Object}          view The view to amend
 */
async function amendView (req, view) {
	if (!view) { return; }

	// Global fields
	view.year = moment().format('YYYY');
	view.version = CR.version;
	view.pagePath = req.originalUrl;
	view.csrf_token = req.csrfToken();

	// Page data
	if (view.pageDataObj) {
		view.pageDataJSON = safeInlineJSONStringify(view.pageDataObj);
	}

	// User data
	if (req.user) {
		view.user = {
			email: req.user.email,
			longName: req.user.getLongName(),
			shortName: req.user.getShortName(),
			briefName: req.user.getBriefName(),
			details: req.user.getNameDetails(),
			hasPicture: req.user.hasPicture(false),
			pictures: req.user.getPictureURLs(false)
		};

		if (!view.permissionsCheck) { view.permissionsCheck = []; }
		const permissions = {};
		view.permissions = {}
		for (let perm of view.permissionsCheck) {
			const hasPerm = await req.user.hasPermission(perm);
			permissions[perm] = hasPerm;

			let path = view.permissions;
			const permsBits = perm.split('.');
			for (let i in permsBits) {
				const bit = permsBits[i];
				const isLast = i + 1 === permsBits.length;
				if (!(bit in path)) {
					if (isLast) {
						path[bit] = hasPerm;
					} else {
						path[bit] = {};
					}
				}
				path = path[bit];
			}
		}
		view.permissionsJSON = JSON.stringify(permissions);
	} else {
		view.user = false;
		view.permissionsJSON = '{}';
	}

	// Menu
	view.menu = [
		{
			name: 'Hejmo',
			icon: 'home',
			href: '/',
			active: req.originalUrl === '/'
		},
		{
			name: 'Aktivuloj',
			icon: 'people',
			href: '/aktivuloj',
			active: /^\/aktivuloj/.test(req.originalUrl)
		}
	];

	// Cirkuleroj
	if (req.user && await req.user.hasPermission('cirkuleroj.manage')) {
		view.menu.push({
			name: 'Cirkuleroj',
			icon: 'assignment',
			active: /^\/cirkuleroj/.test(req.originalUrl),
			children: [
				{
					name: 'Venontaj cirkuleroj',
					href: '/cirkuleroj/venontaj'
				},
				{
					name: 'Agordoj',
					href: '/cirkuleroj/agordoj'
				},
				{
					name: 'Arkivo',
					href: '/cirkuleroj/arkivo'
				}
			]
		});
	} else {
		view.menu.push({
			name: 'Cirkuleroj',
			icon: 'assignment',
			href: '/cirkuleroj/arkivo',
			active: /^\/cirkuleroj/.test(req.originalUrl)
		});
	}

	// Resursoj
	view.menu.push({
		name: 'Eksteraj resursoj',
		icon: 'http',
		href: '/resursoj',
		active: /^\/resursoj/.test(req.originalUrl)
	});
	
	// Administrado
	const menuAdmin = [];
	if (req.user && await req.user.hasPermission('resource.manage')) {
		menuAdmin.push({
			name: 'Resursoj',
			href: '/administrado/resursoj'
		});
	}
	if (req.user && await req.user.hasPermission('users.view')) {
		menuAdmin.push({
			name: 'Uzantoj',
			href: '/administrado/uzantoj'
		});
	}
	if (menuAdmin.length > 0) {
		view.menu.push({
			name: 'Administrado',
			icon: 'build',
			active: /^\/administrado/.test(req.originalUrl),
			children: menuAdmin
		});
	}
}
