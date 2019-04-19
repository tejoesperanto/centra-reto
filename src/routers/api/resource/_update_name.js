import { removeUnsafeChars } from '../../../util';

async function update_name (req, res, next) {
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

    const stmt = CR.db.resources.prepare('update resource set name = ? where id = ?');
    stmt.run(name, req.body.resource_id);

    res.sendAPIResponse();
}

export default update_name;
