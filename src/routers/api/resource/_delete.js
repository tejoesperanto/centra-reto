async function delete_resource (req, res, next) {
	/**
	 * POST /delete
	 * Deletes a resource
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * resource.manage
	 *
	 * Parameters:
	 *   resource_id (number) The id of the resource to remove
	 *   
	 * Throws:
	 * INVALID_ARGUMENT    [argument]
	 * RESOURCE_NOT_FOUND
	 */
	
	if (!await req.requirePermissions('resource.manage')) { return; }

	const fields = [
		'resource_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.resource_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['resource_id']);
		return;
	}

	const stmt = CR.db.rekursoj.prepare('delete from resource where id = ?');
	const info = stmt.run(req.body.resource_id);

	if (info.changes === 0) {
		res.sendAPIError('RESOURCE_NOT_FOUND');
		return;
	}

	res.sendAPIResponse();
}

export default delete_resource;
