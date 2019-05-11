import { removeUnsafeChars } from '../../../util';

async function update_description (req, res, next) {
    /**
     * POST /update_description
     * Updates a resource's description
     *
     * Login required
     * Initial setup required
     *
     * Permissions required:
     * resource.manage
     *
     * Parameters:
     *   resource_id (number) The id of the resource
     *   description (string) The new description of the resource
     *                        Max length: 50 chars
     *
     * Throws:
     * INVALID_ARGUMENT    [argument]
     * RESOURCE_NOT_FOUND
     */
    
    if (!await req.requirePermissions('resource.manage')) { return; }

    const fields = [
        'resource_id',
        'description'
    ];
    if (!req.handleRequiredFields(fields)) { return; }

    if (!Number.isSafeInteger(req.body.resource_id)) {
        res.sendAPIError('INVALID_ARGUMENT', ['resource_id']);
        return;
    }

    if (typeof req.body.description !== 'string' || req.body.description.length > 100) {
        res.sendAPIError('INVALID_ARGUMENT', ['description']);
        return;
    }
    const description = removeUnsafeChars(req.body.description);

    let stmt = CR.db.resources.prepare('update resource set description = ? where id = ?');
    stmt.run(description, req.body.resource_id);

    res.sendAPIResponse();
}

export default update_description;
