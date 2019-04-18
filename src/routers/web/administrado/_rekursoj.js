async function administrado_rekursoj (req, res, next) {
    if (!await req.requirePermissions('resource.view')) { return; }

    const data = {
        title: 'Administrado de rekursoj',
        scripts: [
            '/js/cr/main/administrado/rekursoj.js',
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
    await res.sendRegularPage('administrado/rekursoj', data);
}

export default administrado_rekursoj;
