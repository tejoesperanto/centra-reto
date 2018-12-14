import Handlebars from 'handlebars';
import fs from 'pn/fs';

/**
 * Compiles and renders a handlebar template, much like the old Mustache api
 * @param  {string} tmpl   The template string
 * @param  {Object} [view] The view
 * @return {string}        The rendered template
 */
export function renderTemplate (tmpl, view = {}) {
	const template = Handlebars.compile(tmpl);
	return template(view);
}

export async function renderFileTemplate (file, view = {}) {
	const tmpl = await fs.readFile(file, 'utf8');
	return renderTemplate(tmpl, view);
}

/**
 * Promise.all but for an object instead of an array
 * @param  {Object} promises string:Promise mapping
 * @return {Object} The result of all the promises
 */
export async function promiseAllObject (promises) {
	const responseArray = await Promise.all(Object.values(promises));
	const responseObject = {};

	const keys = Object.keys(promises);
	for (let i in responseArray)  {
		responseObject[keys[i]] = responseArray[i];
	}

	return responseObject;
}

/**
 * Removes unsafe unicode characters from a string
 * @param  {string} str
 * @return {string}
 */
export function removeUnsafeChars (str) {
	str = str.toString();
	str = str.replace(/([\u0000-\u0009\u000b-\u001f\u007f])/g, '');
	return str;
}

/**
 * Removes unsafe unicode characters and newlines from a string
 * @param  {string} str
 * @return {string}
 */
export function removeUnsafeCharsOneLine (str) {
	str = removeUnsafeChars(str);
	str = str.replace(/\u000a/g, '');
	return str;
}

/**
 * Like JSON.stringify but it replaces angle brakcets with their unicode codes to prevent inline HTML JSON XSS.
 * Equivalent to using JSON_HEX_TAG in `json_encode()` in PHP
 * @param  {Object} obj
 * @return {string}
 */
export function safeInlineJSONStringify (obj) {
	let json =  JSON.stringify(obj);
	json = json.replace(/</g, '\\u003C');
	return json;
}

const ESC_MAP = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/**
 * Escapes HTML characters in a string
 * @param  {string}  str            The string to escape
 * @param  {boolean} [forAttribute] Whether this is for use in an html attribute
 * @return {string}
 */
export function escapeHTML (str, forAttribute = false) {
	return str.replace(forAttribute ? /[&<>'"]/g : /[&<>]/g, function (c) {
        return ESC_MAP[c];
    });
}
