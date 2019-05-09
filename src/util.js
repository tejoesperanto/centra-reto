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

/**
 * Performs the caesar cipher (ROT13) on the input string
 * @param  {string} str
 * @return {string}
 */
export function rot13 (str) {
	return str.replace(/[A-Za-z]/g, c => {
		return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
			.charAt(
				"NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm".indexOf(c)
			);
	});
}

/**
 * Checks if input string corresponds with valid URL
 * @param {string} str
 */
export function stringIsAValidUrl (str) {
	var re_weburl = new RegExp(
      "^" +
        // protocol identifier (optional)
        // short syntax // still required
        "(?:(?:(?:https?|ftp):)?\\/\\/)" +
        // user:pass BasicAuth (optional)
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
          // IP address exclusion
          // private & local networks
          "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
          "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
          // IP address dotted notation octets
          // excludes loopback network 0.0.0.0
          // excludes reserved space >= 224.0.0.0
          // excludes network & broacast addresses
          // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
          // host & domain names, may end with dot
          // can be replaced by a shortest alternative
          // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
          "(?:" +
            "(?:" +
              "[a-z0-9\\u00a1-\\uffff]" +
              "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
            ")?" +
            "[a-z0-9\\u00a1-\\uffff]\\." +
          ")+" +
          // TLD identifier name, may end with dot
          "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
        ")" +
        // port number (optional)
        "(?::\\d{2,5})?" +
        // resource path (optional)
        "(?:[/?#]\\S*)?" +
      "$", "i"
    );
    return re_weburl.test(str);
};
