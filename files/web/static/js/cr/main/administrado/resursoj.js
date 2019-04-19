$(function () {
    // Existing resources
    var tableData = setUpDataTable({
        el: '#resources-table',
        method: 'post'  ,
        url: '/api/resursoj/list',
        select: [ 'id', 'name', 'description', 'url' ],
        defaultOrder: [ 1, 'asc' ],
    });
    let table = tableData.table;

    $('#resources-table-reload').click(function () {
        table.draw();
    });

    var loaderTemplate = cloneTemplate('#template-loader');

    table.on('draw', function () {
        if (userPerms['resource.modify']) {
            // Apply click listeners to all rows
            var rows = table.rows().nodes().to$();
            rows.addClass('clickable');
            rows.on('click', function () { // The listener is automatically removed upon the next draw
                var row = table.row(this);
                var rowData = tableData.getRowData(row, 'id');
                var modalTitle = 'Resurso ' + rowData.url;

                swal({
                    title: modalTitle,
                    content: loaderTemplate[0],
                    buttons: false
                });

                var div = cloneTemplate('#template-resource-modal');
                var resourceName = div.find('.change-name-modal-input');
                resourceName.val(rowData.name);
                var resourceDescription = div.find('.change-description-modal-input');
                resourceDescription.val(rowData.description);

                swal({
                    title: modalTitle,
                    content: div[0],
                    buttons: 'Fermi'
                });

                if (!userPerms['resource.delete']) {
                    div.find('.resource-modal-delete-resource-row').remove();
                } else {
                    div.find('.resource-modal-delete-resource').on('click', function () {
                        swal({
                            title: 'Forigo de resurso',
                            text: 'Ĉu vi certas, ke vi volas forigi la resurson kun la ligilo ' + rowData.url + '?',
                            buttons: [
                                'Nuligi',
                                {
                                    text: 'Forigi',
                                    closeModal: false
                                }
                            ]

                        }).then(function (e) {
                            if (!e) { return; }

                            performAPIRequest('post', '/api/resursoj/delete', { resource_id: rowData.id })
                                .then(function (res) {
                                    table.draw();
                                    swal.stopLoading();

                                    if (res.success) {
                                        swal.close();
                                    }
                                });
                        });
                    });
                }

                // Change URL
                div.find('.resource-modal-change-url').click(function () {
                    var changeURLTemplate = cloneTemplate('#template-change-url-modal');

                    var form = changeURLTemplate.find('.change-url-modal-form');
                    var input = changeURLTemplate.find('.change-url-modal-input');
                    input.val(rowData.url);
                    input.on('input', function () {
                        var valid = form[0].checkValidity();
                        $('.swal-button--confirm').attr('disabled', !valid);
                    });
                    $.AdminBSB.input.activate(form);

                    form.submit(function (e) {
                        e.preventDefault();
                        $('.swal-button--confirm').click();
                    });

                    swal({
                        title: 'Ŝanĝo de ligilo',
                        content: changeURLTemplate[0],
                        buttons: [
                            'Nuligi',
                            {
                                text: 'Ŝanĝi',
                                closeModal: false
                            }
                        ]
                    }).then(function (isConfirm) {
                        if (!isConfirm) { return; }

                        swal({
                            title: 'Ŝanĝo de ligilo',
                            text: 'Ĉu vi certas, ke vi volas ŝanĝi la ligilon de ' + rowData.url + ' al ' + input.val() + '?',
                            buttons: [
                                'Nuligi',
                                {
                                    text: 'Ŝanĝi',
                                    closeModal: false
                                }
                            ]
                        }).then(function (isConfirm) {
                            if (!isConfirm) { return; }

                            var apiData = {
                                resource_id: rowData.id,
                                url: input.val()
                            };

                            performAPIRequest('post', '/api/resursoj/update_url', apiData, false)
                                .then(function (res) {
                                    table.draw();
                                    swal.close();
                                })
                                .catch(function (err) {
                                    if (err.error === 'URL_TAKEN') {
                                        swal({
                                            title: 'Ligilo jam uzata',
                                            icon: 'error',
                                            button: 'Bone'
                                        });
                                    } else {
                                        showError(err);
                                    }
                                })
                                .finally(function () {
                                    swal.stopLoading();
                                });
                        });
                    });
                });

                // Change name
                div.find('.resource-modal-change-name').click(function () {
                    var form = div.find('.change-name-modal-form');
                    var input = div.find('.change-name-modal-input');
                    input.on('input', function () {
                        var valid = form[0].checkValidity();
                        $('.swal-button--confirm').attr('disabled', !valid);
                    });
                    $.AdminBSB.input.activate(form);

                    form.submit(function (e) {
                        e.preventDefault();
                        $('.swal-button--confirm').click();
                    });

                    swal({
                        title: 'Ŝanĝo de priskribo',
                        text: `Ĉu vi certas, ke vi volas ŝanĝi la nomon de '${rowData.name}' al '${input.val()}'`,
                        buttons: [
                            'Nuligi',
                            {
                                text: 'Ŝanĝi',
                                closeModal: false
                            }
                        ]
                    }).then(function (isConfirm) {
                        if (!isConfirm) { return; }

                        var apiData = {
                            resource_id: rowData.id,
                            name: input.val()
                        };

                        performAPIRequest('post', '/api/resursoj/update_name', apiData, false)
                            .then(function (res) {
                                table.draw();
                                swal.close();
                            })
                            .catch(function (err) {
                                showError(err);
                            })
                            .finally(function () {
                                swal.stopLoading();
                            });
                    });
                });

                // Change description
                div.find('.resource-modal-change-description').click(function () {
                    var form = div.find('.change-description-modal-form');
                    var input = div.find('.change-description-modal-input');
                    input.on('input', function () {
                        var valid = form[0].checkValidity();
                        $('.swal-button--confirm').attr('disabled', !valid);
                    });
                    $.AdminBSB.input.activate(form);

                    form.submit(function (e) {
                        e.preventDefault();
                        $('.swal-button--confirm').click();
                    });

                    swal({
                        title: 'Ŝanĝo de priskribo',
                        text: `Ĉu vi certas, ke vi volas ŝanĝi la priskribon de '${rowData.description}' al '${input.val()}'`,
                        buttons: [
                            'Nuligi',
                            {
                                text: 'Ŝanĝi',
                                closeModal: false
                            }
                        ]
                    }).then(function (isConfirm) {
                        if (!isConfirm) { return; }

                        var apiData = {
                            resource_id: rowData.id,
                            description: input.val()
                        };

                        performAPIRequest('post', '/api/resursoj/update_description', apiData, false)
                            .then(function (res) {
                                table.draw();
                                swal.close();
                            })
                            .catch(function (err) {
                                showError(err);
                            })
                            .finally(function () {
                                swal.stopLoading();
                            });
                    });
                });
            });
        }
    });

    // Create new resource
    if (userPerms['resource.create']) {
        // Create resource submit
        $('#create-resource-form').submit(function (e) {
            e.preventDefault();

            var data = serializeToObj(this);

            var submitButton = $('#create-resource-form-button');

            swal({
                title: 'Kreado de ekstera resurso',
                text: `Ĉu vi certas, ke vi volas krei resurson '${data.name}' kun la ligilo '${data.url}'`,
                buttons: [
                    'Nuligi',
                    {
                        text: 'Krei',
                        closeModal: false
                    }
                ]
            }).then(function (modalE) {
                if (!modalE) { return; }

                submitButton.attr('disabled', true);

                performAPIRequest('post', '/api/resursoj/create', data, false)
                    .then(function (res) {
                        swal.stopLoading();
                        swal.close();
                        tableData.table.draw();

                        // Clean up the form
                        var form = $('#create-resource-form');
                        form[0].reset();
                        // Reactive the inputs
                        form.find('input').blur();
                    })
                    .catch(function (err) {
                        if (err.error === 'URL_TAKEN') {
                            swal({
                                title: 'Ligilo jam uzata',
                                icon: 'error',
                                button: 'Bone'
                            });
                        } else {
                            showError(err);
                        }
                    })
                    .finally(function () {
                        submitButton.removeAttr('disabled');
                    });
            });


        });
    }

});
