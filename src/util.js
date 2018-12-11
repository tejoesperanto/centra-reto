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
