export * as api from './api';
export * as web from './web';

/**
 * Wraps an async function to ensure proper error handling in Express
 * @param  {Function} fn
 * @return {Function}
 */
export function wrap (fn) {
	return (req, res, next) => {
		const promise = fn(req, res, next);
		if (promise.catch) {
			promise.catch(err => next(err));
		}
	};
}

/**
 * Express middleware that redirects any requests to / from users that have not yet completed initial setup
 * @param  {express.Request}  req
 * @param  {express.Response} res
 * @param  {Function}         next
 */
export function requireInitialSetup (req, res, next) {
	if (req.user.hasCompletedInitialSetup()) {
		next();
	} else {
		res.redirect(303, '/');
	}
}
