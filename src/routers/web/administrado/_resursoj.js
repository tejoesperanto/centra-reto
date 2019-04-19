async function administrado_resursoj (req, res, next) {
    if (!await req.requirePermissions('resource.view')) { return; }

    const data = {
        title: 'Administrado de resursoj',
        scripts: [
            '/js/cr/main/administrado/resursoj.js',
            '/plugins/jquery-datatable/datatables.min.js',
            '/js/jquery.dataTables.eo.js'
        ],
        stylesheets: [
            '/plugins/jquery-datatable/datatables.min.css'
        ],
        permissionsCheck: [
            'resource.modify', 'resource.create', 'resource.delete'
        ],
        pageDataObj: {}
    };
    await res.sendRegularPage('administrado/resursoj', data);
}

export default administrado_resursoj;
