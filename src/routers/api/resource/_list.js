import * as CRApi from '..';

async function resource_list (req, res, next) {
    /**
     * POST /list
     * Lists all resources
     *
     * Login required
     * Initial setup required
     *
     * Permissions required:
     * resource.view
     *
     * Parameters:
     * See routers/api#performListQueryStatement
     *
     * Permitted cols:
     * id, name, description, url
     * 
     * Returns:
     * rows_total    (number)   The amount of rows in the table in total
     * rows_filtered (number)   The amount of rows in the table after filtering
     * data          (Object[]) The rows
     *   id                   (number)      The resource's id
     *   name                 (string)      The resource's display name
     *   description          (string)      The resource's description
     *   url                  (string)      The resource's URL
     * 
     * Throws:
     * See routers/api#performListQueryStatement
     */
    
    if (!await req.requirePermissions('resource.view')) { return; }

    const table = 'resource';
    const dbData = await CRApi.performListQueryStatement({
        req: req,
        res: res,
        db: CR.db.rekursoj,
        table: table,
        colsAllowed: [
            'id',
            'name',
            'description',
            'url'
        ],
        alwaysSelect: [
            'id',
            'name',
            'description',
            'url'
        ],
        customCols: []
    });

    if (!dbData) { return; }

    const output = dbData.data.map(row => {
        const rowOutput = {};
        for (let col of dbData.select) {
            const val = row[col];

            if (col === 'name') {
                rowOutput[col] = val;

            } else if (dbData.select.indexOf(col) > -1) {
                rowOutput[col] = val;
            }
        }
        return rowOutput;
    });

    res.sendAPIResponse({
        data: output,
        rows_total: dbData.rowsTotal,
        rows_filtered: dbData.rowsFiltered
    });
}

export default resource_list;
