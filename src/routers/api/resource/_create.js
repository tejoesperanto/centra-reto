import { removeUnsafeCharsOneLine, removeUnsafeChars, stringIsAValidUrl } from '../../../util';

async function create (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /create
	 * Creates a new resource
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * resource.manage
	 *
	 * Parameters:
	 *   name        (string)  The name of the rsource
	 *                         Max length: 50 chars
	 *   description (string)  The name of the rsource
	 *                         Max length: 100 chars
	 *   url         (string)  The name of the rsource
	 *                         Max length: 100 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 * NAME_TAKEN
	 * URL_INVALID
	 * URL_TAKEN
	 */

	if (!await req.requirePermissions('resource.manage')) { return; }

	// Begin data validation
	const fields = [
		'name',
		'description',
		'url'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (typeof req.body.name !== 'string' || req.body.name.length > 50) {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}

	if (typeof req.body.description !== 'string' || req.body.description.length > 100) {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}

	if (typeof req.body.url !== 'string' || req.body.url.length > 100) {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}

	// Check if the url is valid
	let processedUrl = removeUnsafeCharsOneLine(req.body.url.toLowerCase());
	let processedDescription = removeUnsafeChars(req.body.description);
	let processedName = removeUnsafeCharsOneLine(req.body.name);

	if (!stringIsAValidUrl(processedUrl)){
		processedUrl = `http://${processedUrl}`;
	}
	if (!stringIsAValidUrl(processedUrl)){
		res.sendAPIError('URL_INVALID');
		return;
	}

	// Check if the url is taken
	let stmt = CR.db.resources.prepare('select 1 from resource where url = ?');
	let exists = !!stmt.get(processedUrl);
	if (exists) {
		res.sendAPIError('URL_TAKEN');
		return;
	}

	// Check if the name is taken
	stmt = CR.db.resources.prepare('select 1 from resource where name = ?');
	exists = !!stmt.get(processedName);
	if (exists) {
		res.sendAPIError('NAME_TAKEN');
		return;
	}

	// End data validation

	// Insert the resource
	stmt = CR.db.resources.prepare('insert into resource (name, description, url) values (@name, @description, @url)');
	stmt.run({
		name: removeUnsafeCharsOneLine(processedName),
		description: removeUnsafeChars(processedDescription),
		url: processedUrl
	});

	res.sendAPIResponse();
}

export default create;
