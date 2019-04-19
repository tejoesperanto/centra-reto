import { removeUnsafeCharsOneLine } from '../../../util';

async function create (req, res, next) {
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

	// Check if the url is taken
	let stmt = CR.db.resources.prepare('select 1 from resource where url = ?');
	const exists = !!stmt.get(req.body.url.toLowerCase());
	if (exists) {
		res.sendAPIError('URL_TAKEN');
		return;
	}
	// End data validation

	// Insert the resource
	stmt = CR.db.resources.prepare('insert into resource (name, description, url) values (@name, @description, @url)');
	stmt.run({
		name: removeUnsafeCharsOneLine(req.body.name),
		description: removeUnsafeCharsOneLine(req.body.description),
		url: removeUnsafeCharsOneLine(req.body.url.toLowerCase())
	});

	res.sendAPIResponse();
}

export default create;
