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
 * Express middleware that kills the sessions of users that have been disabled
 */
export function middlewareKillDisabledUsers (req, res, next) {
	if (req.user && !req.user.enabled) {
		req.logout();
	}
	next();
}
