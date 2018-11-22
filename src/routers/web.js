import express from 'express';
import Mustache from 'mustache';
import fs from 'pn/fs';
import path from 'path';
import moment from 'moment-timezone';

import { wrap } from '.';

export function init () {
	const router = express.Router();

	// TODO:
	// /novapasvorto
	// /kondichoj

	// Handle regular pages
	router.get('/', wrap(regularPageIndex));

	// Handle full pages
	router.get('/alighi/:email/:activationKey', wrap(fullPageAlighi));
	router.get('/ensaluti', wrap(fullPageEnsaluti));

	return router;
}

// Utility functions
async function showError (code, msg, req, res) {
	await sendFullPage(res, 'error', {
		error_code: code,
		error_message: msg
	});
}

async function renderTemplate (file, view) {
	if (!CR.cacheEnabled) {
		Mustache.clearCache();
	}

	const template = await fs.readFile(file, 'utf8');
	const render = Mustache.render(template, view);

	return render;
}

async function sendTemplate (res, file, view) {
	const render = await renderTemplate(file, view);
	res.send(render);
}

async function renderRegularPage (page, data) {
	const innerPath = path.join(CR.filesDir, 'web', 'templates_page', page + '.html');
	const inner = await renderTemplate(innerPath, data);
	data.page = inner;
	const outer = await renderTemplate(path.join(CR.filesDir, 'web', 'page.html'), data);
	return outer;
}

function amendView (view) {
	view.year = moment().format('YYYY');
	view.version = CR.version;
}

async function sendRegularPage (res, page, data) {
	amendView(data);
	const render = await renderRegularPage(page, data);
	res.send(render);
}

function sendFullPage (res, page, data) {
	amendView(data);
	const file = path.join(CR.filesDir, 'web', 'templates_full', page + '.html');
	return sendTemplate(res, file, data);
}

// Handlers
// Errors
export function error404 (req, res, next) {
	res.status(404);
	showError(404, 'Paĝo ne trovita', req, res);
}

export function error500 (err, req, res, next) {
	CR.log.error(`Okazis eraro ĉe ${req.method} ${req.originalUrl}\n${err.stack}`);
	res.status(500);
	showError(500, 'Okazis interna eraro', req, res);
}

// Regular pages
async function regularPageIndex (req, res, next) {
	const data = {
		title: 'Hejmo'
	};
	await sendRegularPage(res, 'index', data);
}

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
	await sendFullPage(res, 'alighi', data);
}

async function fullPageEnsaluti (req, res, next) {
	const data = {
		
	};
	await sendFullPage(res, 'ensaluti', data);
}
