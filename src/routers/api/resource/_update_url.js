import { removeUnsafeChars } from '../../../util';

async function update_url (req, res, next) {
    /**
     * POST /update_url
     * Updates a resource's url
     *
     * Login required
     * Initial setup required
     *
     * Permissions required:
     * resource.manage
     *
     * Parameters:
     *   resource_id (number) The id of the resource
     *   url         (string) The new url of the resource
     *                        Max length: 50 chars
     *
     * Throws:
     * INVALID_ARGUMENT    [argument]
     * RESOURCE_NOT_FOUND
     * URL_TAKEN
     */
    
    if (!await req.requirePermissions('resource.manage')) { return; }

    const fields = [
        'resource_id',
        'url'
    ];
    if (!req.handleRequiredFields(fields)) { return; }

    if (!Number.isSafeInteger(req.body.resource_id)) {
        res.sendAPIError('INVALID_ARGUMENT', ['resource_id']);
        return;
    }

    if (typeof req.body.url !== 'string' || req.body.url.length > 100) {
        res.sendAPIError('INVALID_ARGUMENT', ['url']);
        return;
    }
    const url = removeUnsafeChars(req.body.url).toLowerCase();

    // Check if the url is taken
    let stmt = CR.db.rekursoj.prepare('select 1 from resource where url = ?');
    const exists = !!stmt.get(req.body.url.toLowerCase());
    if (exists) {
        res.sendAPIError('URL_TAKEN');
        return;
    }

    stmt = CR.db.rekursoj.prepare('update resource set url = ? where id = ?');
    stmt.run(url, req.body.resource_id);

    res.sendAPIResponse();
}

export default update_url;
