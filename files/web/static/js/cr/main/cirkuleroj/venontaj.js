$(function () {
	// CREATE CIRKULERO
	var defaultDate = moment();
	defaultDate.date(5);
	defaultDate.hour(12);
	defaultDate.minute(0);
	defaultDate.add(1, 'month');
	$('#create-cirkulero-form-deadline').datetimepicker({
		locale: 'eo',
		minDate: moment(),
		defaultDate: defaultDate
	});
	autosize($('#create-cirkulero-form-note'));
	$('#create-cirkulero-form').submit(function (e) {
		e.preventDefault();

		var apiData = {
			id: parseInt($('#create-cirkulero-form-id').val(), 10),
			name: $('#create-cirkulero-form-name').val(),
			deadline: $('#create-cirkulero-form-deadline').data("DateTimePicker").date().unix(),
			reminders: $('#create-cirkulero-form-reminders').prop('checked'),
			open: $('#create-cirkulero-form-open').prop('checked'),
			note: $('#create-cirkulero-form-note').val() || null
		};

		var submitButton = $('#create-cirkulero-form-button');

		swal({
			title: 'Ĉu vi certas, ke vi volas krei novan cirkuleron?',
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

			performAPIRequest('post', '/api/cirkuleroj/create', apiData, false)
				.then(function (res) {
					swal.stopLoading();
					swal.close();
					tableData.table.draw();

					// Clean up the form
					var form = $('#create-cirkulero-form');
					form[0].reset();
					// Reactive the inputs
					form.find('input,textarea').blur();
				})
				.catch(function (err) {
					if (err.error === 'ID_TAKEN') {
						swal({
					        title: 'Cirkulernumero jam uzata',
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

	// EXISTING CIRKULEROJ
	var tableData = setUpDataTable({
		el: '#cirkuleroj-table',
		method: 'post'	,
		url: '/api/cirkuleroj/list',
		select: [ 'id', 'name', 'deadline', 'open', 'reminders' ],
		defaultOrder: [ 0, 'asc' ],
		options: {
			searching: false
		},
		globalWhere: [{
            col: 'published',
            type: '=',
            val: 0
        }],
        dataFormatter: function (val, col) {
        	if (col.name === 'deadline') {
        		val = moment.unix(val).format('LLL');
        	}

        	return val;
        }
	});
	var table = tableData.table;
	var loaderTemplate = cloneTemplate('#template-loader');
	$('#cirkuleroj-table-reload').click(function () {
		table.draw();
	});
	table.on('draw', function () {
		// Apply click listeners to all rows
		var rows = table.rows().nodes().to$();
		rows.addClass('clickable');
		rows.on('click', function () { // The listener is automatically removed upon the next draw
			var row = table.row(this);
			var rowData = tableData.getRowData(row, 'id');

			var modalTitle = 'Cirkulero n-ro ' + rowData.id + ', ' + rowData.name;

			swal({
				title: modalTitle,
				content: loaderTemplate[0],
				buttons: false
			});

			// Obtain contributions
			performAPIRequest('post', '/api/cirkuleroj/list_contributors', { cirkulero_id: rowData.id })
				.then(function (res) {
					if (!res.success) { return; }

					var template = cloneTemplate('#template-cirkulero-modal');
					for (var i in pageData.groups.statistics) {
						var group = pageData.groups.statistics[i];

						var contribGroup;
						for (var n in res.groups) {
							if (res.groups[n].group.id === group.id) {
								contribGroup = res.groups[n];
								break; 
							}
						}

						var contributors = [];
						var nonContributors = [];
						var totalUsers = contribGroup.users.length;
						for (var n in contribGroup.users) {
							var user = contribGroup.users[n];
							var name = user.long_name + ' (' + user.group_name + ')';
							if (user.contributed) {
								contributors.push(name);
							} else {
								nonContributors.push(name)
							}
						}

						// Actions
						template.find('.cirkulero-modal-prepare').click(function () {
							window.location.href = '/cirkuleroj/' + rowData.id + '/pretigi';
						});

						// Statitics
						var stats = template.find('.cirkulero-modal-statistics');
						var div = document.createElement('div');
						stats.append(div);

						var h4 = document.createElement('h4');
						div.appendChild(h4);
						h4.textContent = contribGroup.group.name + ' (' +  contributors.length + '/' + totalUsers + ')';

						if (totalUsers > 0) {
							var contribEl = document.createElement('p');
							div.appendChild(contribEl);
							var contribPreText = document.createTextNode('Kontribuis: ');
							if (contributors.length) {
								var contribText = document.createTextNode(contributors.join(', '));
							} else {
								var contribText = document.createElement('i');
								contribText.textContent = 'Neniu';
							}
							contribEl.appendChild(contribPreText);
							contribEl.appendChild(contribText);

							var noContribEl = document.createElement('p');
							div.appendChild(noContribEl);
							var noContribPreText = document.createTextNode('Ne kontribuis: ');
							if (nonContributors.length) {
								var noContribText = document.createTextNode(nonContributors.join(', '));
							} else {
								var noContribText = document.createElement('i');
								noContribText.textContent = 'Neniu';
							}
							noContribEl.appendChild(noContribPreText);
							noContribEl.appendChild(noContribText);
						} else {
							var el = document.createElement('i');
							div.appendChild(el);
							el.textContent = 'Neniuj membroj';
						}
					}

					swal({
						title: modalTitle,
						content: template[0],
						button: 'Fermi'
					});
				});
		});
	});
});
