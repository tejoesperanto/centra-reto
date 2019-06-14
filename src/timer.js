import * as CRCirkulero from './api/cirkulero';
import User from './api/user';

let timers = [];

/**
 * Sets up the timers
 */
export function init () {
	CR.log.info('Agordas tempeventojn');

	addTimer({
		time: CR.conf.timers.cirkuleroReminders,
		fn: CRCirkulero.checkReminders,
		immediate: true
	});

	addTimer({
		time: CR.conf.timers.cirkuleroDeadlines,
		fn: CRCirkulero.checkDeadlines,
		immediate: true
	});

	addTimer({
		time: CR.conf.timers.passwordResetCleanup,
		fn: User.cleanUpPasswordResets,
		immediate: true
	});

	addTimer({
		time: CR.conf.timers.activationKeyCleanup,
		fn: User.cleanUpActivationKeys,
		immediate: true
	});
}

/**
 * Adds a new timer
 * @param {Object}   options
 * @param {number}   options.time        The interval in seconds
 * @param {Function} options.fn          The function to run
 * @param {Array}    [options.args]      The args to supply to the function
 * @param {boolean}  [options.immediate] Whether to additionally run the function immediately
 */
function addTimer ({
	time,
	fn,
	args = [],
	immediate = false
} = {}) {
	time = time * 1000; // milliseconds
	if (immediate) { fn(...args); }
	const timer = setInterval(fn, time, ...args);
	timers.push(timer);
}

/**
 * Gets all timers
 * @return {Timeout[]}
 */
export function getAllTimers () {
	return timers;
}

/**
 * Disables and removes all timers
 */
export function removeAllTimers () {
	for (let timer of timers) {
		clearInterval(timer);
	}
	timers = [];
}
