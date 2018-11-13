#!/usr/bin/env node

import 'babel-polyfill';
import 'source-map-support/register'

import winston from 'winston';
import yargsParser from 'yargs-parser';
import fs from 'fs-extra';
import path from 'path';
import mergeOptions from 'merge-options';
import SQLDatabase from 'better-sqlite3';
import moment from 'moment-timezone';

import CRHttp from './http';

(async () => {
	const DBs = [ 'users' ];

	global.CR = {
		version: require('../package.json').version,
		log: winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.colorize(),
				winston.format.timestamp({
					format: () => moment.tz('UTC').format('YYYY-MM-DD HH:mm:ss:SSS [Z]')
				}),
				winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
			),
			transports: [ new winston.transports.Console() ],

		}),
		argv: null, // init
		dataDir: null, // init
		defaultDataDir: path.normalize(path.join(__dirname, '../files/data_default')),
		config: null, // init
		db: {}, // init
		app: null, // init
		cacheEnabled: true,
		limiter: null // init
	};

	// Init
	CR.log.info("Centra Reto versio %s", CR.version)

	// Read args
	CR.argv = yargsParser.detailed(
		process.argv.slice(2),
		{
			boolean: [ 'helmet', 'cache', 'secureCookie', 'limiter' ],
			default: { helmet: true, cache: true, 'secureCookie': true, limiter: true, dev: false },
			alias: { 'd': [ 'dev' ] }
		}
	).argv;

	// Hard-coded argv aliases
	if (CR.argv.dev) {
		CR.argv.helmet = false;
		CR.argv.cache = false;
		CR.argv.secureCookie = false;
		CR.argv.limiter = false;
	}

	// Data files, config
	if (CR.argv._.length < 1) {
		CR.log.error("Mankas argumento <dosierujo>");
		process.exit(1);
	}

	if (CR.argv._.length > 1) {
		CR.log.error("Tro da argumentoj");
		process.exit(1);
	}

	CR.dataDir = path.normalize(CR.argv._[0]);

	// Make sure the provided data dir exists
	await fs.ensureDir(CR.dataDir);

	// Add missing files to data dir
	const handleDataDir = async dir => {
		const files = await fs.readdir(path.join(CR.defaultDataDir, dir), { withFileTypes: true });
		for (let file of files) {
			const fileFrom = path.join(CR.defaultDataDir, dir, file.name);
			const fileTo = path.join(CR.dataDir, dir, file.name);
			if (file.isDirectory()) {
				fs.ensureDir(fileFrom);
				await handleDataDir(path.join(dir, file.name));
			} else {
				await fs.copy(fileFrom, fileTo, { overwrite: false });
			}
		}

	};
	CR.log.info("Kreas datumdosierojn");
	await handleDataDir('');

	// Apply user config on top of default config
	const configDefault = await fs.readJson(path.join(CR.defaultDataDir, 'settings.json'));
	const configUser    = await fs.readJson(path.join(CR.dataDir,        'settings.json'));
	CR.conf = mergeOptions(configDefault, configUser);

	// Load databases
	CR.log.info("Ŝarĝas SQLite-datumbazojn");
	for (let dbName of DBs) {
		CR.log.info("... Ŝarĝas %s.db", dbName)
		CR.db[dbName] = new SQLDatabase(path.join(CR.dataDir, dbName + ".db"));
	}

	// Create http server
	CRHttp.init();
})();
