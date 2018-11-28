$(function () {
	// Existing users
	var tableData = setUpDataTable({
		el: '#users-table',
		method: 'post'	,
		url: '/api/user/list',
		select: [ 'id', 'full_name_latin', 'pet_name', 'email', 'enabled', 'active', 'set_up' ],
		defaultOrder: [ 1, 'asc' ],
		replaceOrder: { 'full_name_latin': 'full_name_latin_sort' }
	});
	var table = tableData.table;

	table.on('draw', function () {
		if (userPerms['users.modify']) {
			// Apply click listeners to all rows
			var rows = table.rows().nodes().to$();
			rows.addClass('clickable');
			rows.on('click', function () {
				// The listener is automatically removed upon the next draw
				var data = tableData.getData();
				var row = table.row(this);
				var _rowDataRaw = row.data();
				var _rowData = {};
				for (var i in _rowDataRaw) {
					var val = _rowDataRaw[i];
					var key = tableData.columns[i];
					_rowData[key] = val;
				}
				var id = _rowData.id;
				var rowData;
				for (var i in data.data) {
					if (data.data[i].id === _rowData.id) {
						rowData = data.data[i];
						break;
					}
				}

				var div = cloneTemplate('#template-user-modal');

				if (rowData.enabled) {
					div.find('.user-modal-enable-login').remove();
					var modalTitle  = 'Malŝalto de uzanto';
					var modalText   = 'Ĉu vi certas, ke vi volas malŝalti la uzanton kun la retpoŝtadreso ' + rowData.email + '?';
					var modalButton = 'Malŝalti';
				} else {
					div.find('.user-modal-disable-login').remove();
					var modalTitle  = 'Ŝalto de uzanto';
					var modalText   = 'Ĉu vi certas, ke vi volas ŝalti la uzanton kun la retpoŝtadreso ' + rowData.email + '?';
					var modalButton = 'Ŝalti';
				}

				div.find('.user-modal-enable-button').on('click', function () {
					swal({
						title: modalTitle,
						text: modalText,
						buttons: [
							'Nuligi',
							{
								text: modalButton,
								closeModal: false
							}
						]

					}).then(function () {
						return performAPIRequest('post', '/api/user/toggle_enabled', { user_id: rowData.id });

					}).then(function (res) {
						table.draw();
						swal.stopLoading();

						if (res.success) {
							swal.close();
						}
					});
				});

				if (rowData.set_up || !userPerms['users.delete']) {
					div.find('.user-modal-delete-user-row').remove();
				} else {
					div.find('.user-modal-delete-user').on('click', function () {
						swal({
							title: 'Forigo de uzanto',
							text: 'Ĉu vi certas, ke vi volas forigi la uzanton kun la retpoŝtadreso ' + rowData.email + '?',
							buttons: [
								'Nuligi',
								{
									text: 'Forigi',
									closeModal: false
								}
							]

						}).then(function () {
							return performAPIRequest('post', '/api/user/delete_uninitiated', { user_id: rowData.id });

						}).then(function (res) {
							table.draw();
							swal.stopLoading();

							if (res.success) {
								swal.close();
							}
						});
					});
				}

				swal({
			        title: 'Uzanto ' + rowData.email,
			        content: div[0],
			        button: 'Fermi'
			    });
			});
		}
	});

	// Create new user
	$('#create-user-form').submit(function (e) {
		e.preventDefault();

		var data = serializeToObj(this);
		if (data.send_email === 'on') {
			data.send_email = true;
		} else {
			data.send_email = false;
		}

		var button = $('#create-user-form-button');

		swal({
			title: 'Kreado de uzanto',
			text: 'Ĉu vi certas, ke vi volas krei uzanton kun la retpoŝtadreso ' + data.email + '?',
			buttons: [
				'Nuligi',
				{
					text: 'Krei',
					closeModal: false
				}
			]

		}).then(function () {
			button.attr('disabled', true);

			return performAPIRequest('post', '/api/user/create', data, false);

		}).then(function (res) {
			swal.close();
		}).catch(function (err) {
			if (err.error === 'EMAIL_TAKEN') {

				swal({
			        title: 'Retpoŝtadreso jam uzata',
			        icon: 'error',
			        button: 'Bone'
			    });

			} else {
				showError(err);
			}
		}).finally(function () {
			table.draw();
			swal.stopLoading();

			// Reset the form
			$('#create-user-form-email').val('');
			button.removeAttr('disabled');
		});
	});
});
