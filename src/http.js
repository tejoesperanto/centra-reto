import express from 'express';
import helmet from 'helmet';
import RateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import util from 'util';
import path from 'path';
import bcrypt from 'bcrypt';
import passportLocal from 'passport-local';

import * as CRRouters from './routers';
import User from './api/user';

/**
 * Sets up the http server
 */
export async function init () {
	CR.log.info("Pretigas HTTP-servilon");
	CR.app = express();
	if (CR.conf.trustLocalProxy) {
		// Use the real IP of loopbacks. For users behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
		CR.app.set('trust proxy', 'loopback');
		CR.app.enable('trust proxy');
	}

	if (CR.argv.helmet) {
		CR.app.use(helmet());
	} else {
		CR.log.warn("Helmet malŝaltita");
	}

	if (!CR.argv.cache) {
		CR.cacheEnabled = false;
		CR.log.warn("Cache malŝaltita");
	}

	let limiterMax = 0;
	if (CR.argv.limiter) {
		limiterMax = CR.conf.loginLimit.max;
	} else {
		CR.log.warn("Ensalutlimigo malŝaltita");
	}
	CR.loginLimiter = new RateLimit({
		windowMs: CR.conf.loginLimit.time * 1000,
		max: limiterMax,
		onLimitReached: (req, res, next) => {
			res.setHeader('Retry-After', Math.ceil(CR.conf.loginLimit.time));
			next('TOO_MANY_REQUESTS');
		},
		message: 'Tro da ensalutprovoj, bonvolu reprovi poste.'
	});

	CR.app.use(cookieParser());
	CR.app.use(bodyParser.urlencoded({ extended: true }));
	CR.app.use(bodyParser.json());

	if (!CR.conf.sessionSecret) {
		CR.log.error("Neniu session secret difinita en agordoj");
		process.exit(1);
	}
	CR.app.use(expressSession({
		resave: false,
		saveUninitialized: false,
		secret: CR.conf.sessionSecret,
		name: 'CR_SESSION'
	}));

	CR.app.use(passport.initialize());
	CR.app.use(passport.session());
	CR.app.use(flash());

	// Routing
	CR.app.use('/api', CRRouters.api.init());
	CR.app.use('/', CRRouters.web.init());
	CR.app.use(express.static(path.join(CR.filesDir, 'web', 'static')));

	// Error handling
	CR.app.use(CRRouters.web.error404);
	CR.app.use(CRRouters.web.error500);

	// Passport
	passport.use(new passportLocal.Strategy({
		usernameField: 'email',
		passwordField: 'password'
	}, async (email, password, cb) => {
		// Attempt to find the user
		const user = User.getUserByEmail(email);
		if (!user || !user.enabled) {
			cb(null, false);
			return;
		}

		// Compare the passwords
		const passwordRight = await bcrypt.compare(password, user.password);
		if (!passwordRight) {
			cb(null, false);
			return;
		}

		cb(null, user);
	}));
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});
	passport.deserializeUser(async (id, done) => {
		const user = User.getUserById(id);
		if (!user) {
			done('USER_NOT_FOUND', false);
		} else {
			done(null, user);
		}
	});

	CR.app.listen(CR.conf.servers.http.port, () => {
		CR.log.info("HTTP-servilo pretas je :%s", CR.conf.servers.http.port);
	});
}
