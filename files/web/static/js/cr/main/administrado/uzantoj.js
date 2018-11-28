$(function () {
	// Existing users
	var tableData = setUpDataTable('#users-table', 'post', '/api/user/list', [
		'id', 'full_name_latin', 'pet_name', 'email', 'enabled', 'active', 'set_up'
	], { 'full_name_latin': 'full_name_latin_sort' });
	var table = tableData.table;

	table.on('draw', function () {
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

			// TODO: Don't let users click on a row if they don't have users.modify
			if (rowData.enabled) {
				div.find('.user-modal-enable-login').remove();
			} else {
				div.find('.user-modal-disable-login').remove();
			}

			div.find('.user-modal-enable-button').on('click', function () {
				performAPIRequest('post', '/api/user/toggle_enabled', { user_id: rowData.id })
					.then(function (res) {
						table.draw();

						if (res.success) {
							swal.close();
						}
					});
			});

			if (rowData.set_up) {
				div.find('.user-modal-delete-user-row').remove();
			} else {
				div.find('.user-modal-delete-user-row').on('click', function () {
					performAPIRequest('post', '/api/user/delete_uninitiated', { user_id: rowData.id })
						.then(function (res) {
							table.draw();

							if (res.success) {
								swal.close();
							}
						});
				})
			}

			swal({
		        title: 'Uzanto ' + rowData.email,
		        content: div[0],
		        button: 'Fermi'
		    });
		});
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

			return performAPIRequest('post', '/api/user/create', data,);
		}).then(function (res) {
			table.draw();

			// Reset the form
			$('#create-user-form-email').val('');
			button.removeAttr('disabled');

			if (res.success) {
				swal.stopLoading();
				swal.close();
			}
		});
	});
});
