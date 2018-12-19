$(function () {
	// Group data
	var groupsSearch = new Bloodhound({
		local: pageData.groups,
		identify: function (obj) { return obj.id; },
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('nameBase'),
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	// Format name when adding group with display name
	var setUpGroupsInput = function (groupsInput) {
		var ttInput = groupsInput.parent().find('.tt-input');

		// Disable submitting by pressing enter in tags input field
		ttInput.keypress(function (e) {
			if (e.which == 13) {
				e.preventDefault();
			}
		});
	};

	var handleGroupDisplayName = function (groupsInput, e, addItems, cb) {
		if (!cb) { cb = function(){}; }

		var ttInput = groupsInput.parent().find('.tt-input');

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

		swal({
			title: 'Aldono de grupo',
			content: div[0],
			button: 'Aldoni grupon'

		}).then(function () {
			e.item.nonUserRemoved = true;
			groupsInput.tagsinput('remove', e.item);
			ttInput.focus();

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
				var item = { id: e.item.id, nameBase: formattedName, userArgs: values, nonUserAdded: true };
				if (addItems) { groupsInput.tagsinput('add', item); }
			}

			cb(item);
		});

		window.setTimeout(function () {
			firstInput.focus();
			$('.swal-button--confirm').attr('disabled', true);
		}, 0); // Run when the thread becomes idle
	}

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

	$('#users-table-reload').click(function () {
		tableData.table.draw();
	});

	var loaderTemplate = cloneTemplate('#template-loader');

	table.on('draw', function () {
		if (userPerms['users.modify']) {
			// Apply click listeners to all rows
			var rows = table.rows().nodes().to$();
			rows.addClass('clickable');
			rows.on('click', function () { // The listener is automatically removed upon the next draw
				var row = table.row(this);
				var rowData = tableData.getRowData(row, 'id');
				var modalTitle = 'Uzanto ' + rowData.email;

				swal({
					title: modalTitle,
					content: loaderTemplate[0],
					buttons: false
				});

				performAPIRequest('post', '/api/user/get_groups', { user_id: rowData.id })
					.then(function (res) {
						if (!res.success) { return; }

						var div = cloneTemplate('#template-user-modal');

						if (rowData.enabled) {
							div.find('.user-modal-enable-login').remove();
							var enabledModalTitle  = 'Malŝalto de uzanto';
							var modalText   = 'Ĉu vi certas, ke vi volas malŝalti la uzanton kun la retpoŝtadreso ' + rowData.email + '?';
							var modalButton = 'Malŝalti';
						} else {
							div.find('.user-modal-disable-login').remove();
							var enabledModalTitle  = 'Ŝalto de uzanto';
							var modalText   = 'Ĉu vi certas, ke vi volas ŝalti la uzanton kun la retpoŝtadreso ' + rowData.email + '?';
							var modalButton = 'Ŝalti';
						}

						var groupsInput = div.find('.user-modal-groups');
						groupsInput.tagsinput({
							itemValue: 'id',
							itemText: 'nameBase',
							typeaheadjs: {
								name: 'groups',
								displayKey: 'nameBase',
								source: groupsSearch.ttAdapter()
							}
						});

						for (var i = 0; i < res.groups.length; i++) {
							var group = res.groups[i];
							if (!group.user.direct) { continue; }
							if (!group.user.active) { continue; }

							groupsInput.tagsinput('add', {
								id: group.group.id,
								nameBase: group.user.name
							});
						}

						setUpGroupsInput(groupsInput);

						var showUserModal = function (focusTTInput) {
							swal({
						        title: modalTitle,
						        content: div[0],
						        button: 'Fermi'
						    });

						    if (focusTTInput) {
						    	window.setTimeout(function () {
						    		div.find('.tt-input').focus();
						    	}, 0);
						    }
						};

						// Assigning new groups to a user
						groupsInput.on('itemAdded', function (e) {
							if (e.item.nonUserAdded) { return; }

							var promptConfirmAddGroup = function (item) {
								swal({
									title: 'Aldono al grupo',
									text: 'Ĉu vi certas, ke vi volas aldoni ' + rowData.email + ' al la grupo ' + item.nameBase + '?',
									buttons: [
										'Nuligi',
										{
											text: 'Aldoni',
											closeModal: false
										}
									]

								}).then(function (modalE) {
									if (!modalE) {
										item.nonUserRemoved = true;
										groupsInput.tagsinput('remove', item);
										showUserModal(true);
										return;
									}

									const data = {
										user_id: rowData.id,
										groups: [
											{
												id: item.id,
												args: item.userArgs,
												from: null,
												to: null
											}
										]
									};
									performAPIRequest('post', '/api/user/add_groups', data)
										.then(function (res) {
											swal.stopLoading();

											if (!res.success) { return; }

											groupsInput.tagsinput('add', {
												id: item.id,
												nameBase: item.nameBase,
												nonUserAdded: true
											});

											showUserModal(true);
										});
								});
							};

							if (e.item.nameDisplay) {
								handleGroupDisplayName(groupsInput, e, true, promptConfirmAddGroup);
							} else {
								promptConfirmAddGroup(e.item);
							}
						});

						// Removing a user from groups
						groupsInput.on('itemRemoved', function (e) {
							if (e.item.nonUserRemoved) { return; }

							swal({
								title: 'Forigo de grupo',
								text: 'Ĉu vi certas, ke vi volas forigi ' + rowData.email + ' de la grupo ' + e.item.nameBase + '?',
								buttons: [
									'Nuligi',
									{
										text: 'Forigi',
										closeModal: false
									}
								]

							}).then(function (modalE) {
								if (!modalE) {
									e.item.nonUserAdded = true;
									groupsInput.tagsinput('add', e.item);
									showUserModal(true);
									return;
								}

								const data = {
									user_id: rowData.id,
									groups: [ e.item.id ]
								};

								performAPIRequest('post', '/api/user/end_group_memberships', data)
									.then(function (res) {
										swal.stopLoading();

										if (!res.success) { return; }

										showUserModal(true);
									});
							});
						});

						div.find('.user-modal-enable-button').on('click', function () {
							swal({
								title: enabledModalTitle,
								text: modalText,
								buttons: [
									'Nuligi',
									{
										text: modalButton,
										closeModal: false
									}
								]

							}).then(function (e) {
								if (!e) { return; }

								performAPIRequest('post', '/api/user/toggle_enabled', { user_id: rowData.id })
									.then(function (res) {
										table.draw();
										swal.stopLoading();

										if (res.success) {
											swal.close();
										}
									});
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

								}).then(function (e) {
									if (!e) { return; }

									performAPIRequest('post', '/api/user/delete_uninitiated', { user_id: rowData.id })
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

						if (rowData.active) {
							div.find('.user-modal-resend-activation-mail-row').remove();
						} else {
							div.find('.user-modal-resend-activation-mail-row').on('click', function () {
								swal({
									title: 'Resendo de aktivigmesaĝo',
									text: 'Ĉu vi certas, ke vi volas resendi la aktivigmesaĝon al la uzanto kun la retpoŝtadreso ' + rowData.email + '?',
									buttons: [
										'Nuligi',
										{
											text: 'Resendi',
											closeModal: false
										}
									]
								}).then(function (isConfirm) {
									if (!isConfirm) { return; }

									performAPIRequest('post', '/api/user/resend_activation_mail', { user_id: rowData.id })
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

						showUserModal();
					});
			});
		}
	});

	// Create new user
	if (userPerms['users.create']) {
		// Tags input
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
		setUpGroupsInput(groupsInput);

		// Handle display name formatting
		groupsInput.on('itemAdded', function (e) {
			if (e.item.nameDisplay) {
				handleGroupDisplayName(groupsInput, e, true);
			}
		});

		// Create user submit
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
	}
});
