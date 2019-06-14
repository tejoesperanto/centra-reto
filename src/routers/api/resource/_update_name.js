import { removeUnsafeChars } from '../../../util';

async function update_name (req, res, next) { // eslint-disable-line no-unused-vars
	/**
	 * POST /update_name
	 * Updates a resource's name
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * resource.manage
	 *
	 * Parameters:
	 *   resource_id (number) The id of the resource
	 *   name        (string) The new name of the resource
	 *                        Max length: 50 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * NAME_TAKEN
	 * RESOURCE_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('resource.manage')) { return; }

	const fields = [
		'resource_id',
		'name'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.resource_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['resource_id']);
		return;
	}

	if (typeof req.body.name !== 'string' || req.body.name.length > 50) {
		res.sendAPIError('INVALID_ARGUMENT', ['name']);
		return;
	}
	const name = removeUnsafeChars(req.body.name);

	// Check if the name is taken
	let stmt = CR.db.resources.prepare('select 1 from resource where name = ?');
	const exists = !!stmt.get(name);
	if (exists) {
		res.sendAPIError('NAME_TAKEN');
		return;
	}

	stmt = CR.db.resources.prepare('update resource set name = ? where id = ?');
	stmt.run(name, req.body.resource_id);

	res.sendAPIResponse();
}

export default update_name;
