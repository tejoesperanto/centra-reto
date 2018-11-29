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
	// Tags input
	var groupsSearch = new Bloodhound({
		local: pageData.groups,
		identify: function (obj) { return obj.id; },
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('nameBase'),
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});
	var groupsInput = $('#create-user-form-groups');
	groupsInput.tagsinput({
		itemValue: 'id',
		itemText: 'nameBase',
		typeaheadjs: {
			name: 'groups',
			displayKey: 'nameBase',
			source: groupsSearch.ttAdapter()
		}
	});

	// Disable submitting by pressing enter in tags input field
	$('#create-user-form .tt-input').keypress(function (e) {
		if (e.which == 13) {
			e.preventDefault();
		}
	});

	// Handle display name formatting
	groupsInput.on('beforeItemAdd', function (e) {
		if (e.item.nameDisplay) {
			var div = cloneTemplate('#template-group-modal');
			div.find('.val-name-base').text(e.item.nameBase);

			var form = div.find('.template-group-modal-form');
			var formGroup = div.find('.form-group');
			var firstInput = null;
			for (var i in e.item.args) {
				var arg = e.item.args[i];
				var el = cloneTemplate('#template-group-arg-input');
				formGroup.append(el);
				el.find('label').text(arg);
				var input = el.find('input');
				if (!firstInput) { firstInput = input; }
				input.attr('name', i);
				input.on('input', function () {
					var valid = form[0].checkValidity();
					$('.swal-button--confirm').attr('disabled', !valid);
				});
			}

			form.submit(function (e) {
				e.preventDefault();
				$('.swal-button--confirm').click();
			});

			$.AdminBSB.input.activate(div);

			window.setTimeout(function () {
				firstInput.focus();
				$('.swal-button--confirm').attr('disabled', true);
			}, 0); // Run when the thread becomes idle

			swal({
				title: 'Aldono de grupo',
				content: div[0],
				button: 'Aldoni grupon'

			}).then(function () {
				groupsInput.tagsinput('remove', e.item);
				$('#create-user-form .tt-input').focus();

				var values = [];
				var allSet = true;
				formGroup.find('input[name]').each(function () {
					values[this.name] = this.value.trim();
					if (values[this.name].length === 0) { allSet = false; }
				});

				if (allSet) {
					var formattedName = e.item.nameDisplay;
					for (var i = 0; i < e.item.args.length; i++) {
						var key = '$' + (i + 1);
						formattedName = formattedName.replace(key, values[i]);
					}
					var item = { id: e.item.id, nameBase: formattedName, userArgs: values };
					groupsInput.tagsinput('add', item);
				}
			});
		}

	});

	$('#create-user-form').submit(function (e) {
		e.preventDefault();

		var data = serializeToObj(this);
		if (data.send_email === 'on') {
			data.send_email = true;
		} else {
			data.send_email = false;
		}

		var button = $('#create-user-form-button');

		var createUserFinally = function (partialReset) {
			swal.stopLoading();
			button.removeAttr('disabled');

			if (!partialReset) {
				table.draw();

				// Reset the form
				$('#create-user-form-email').val('').blur();
				groupsInput.tagsinput('removeAll');
			}
		};

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

		}).then(function (e) {
			if (!e) { return; }

			button.attr('disabled', true);

			performAPIRequest('post', '/api/user/create', data, false)
				.then(function (res) {
					var groupsOrg = groupsInput.tagsinput('items');
					var groups = [];
					for (var i in groupsOrg) {
						var group = groupsOrg[i];
						groups.push({
							id: group.id,
							args: group.userArgs,
							from: null,
							to: null
						});
					}

					var data = {
						user_id: res.uid,
						groups: groups
					};

					performAPIRequest('post', '/api/user/add_groups', data)
						.then(function (res) {
							if (res.success) {
								swal.close();
							}

							createUserFinally();
						});
				}).catch(function (err) {
					if (err.error === 'EMAIL_TAKEN') {
						swal({
					        title: 'Retpoŝtadreso jam uzata',
					        icon: 'error',
					        button: 'Bone'
					    });
						createUserFinally(true);
					} else {
						showError(err);
						createUserFinally();
					}
				});
		})
	});
});
