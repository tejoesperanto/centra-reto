$(function () {
	var tableData = setUpDataTable('#users-table', '/api/user/list');
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
				performAPIRequest('/api/user/toggle_enabled', { user_id: rowData.id }, function (res) {
					table.draw();

					if (res.success) {
						swal.close();
					}
				});
			});

			swal({
		        title: 'Uzanto ' + rowData.email,
		        content: div[0],
		        button: 'Fermi'
		    });
		});
	});
});
