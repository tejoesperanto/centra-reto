$(function () {
	moment.locale('eo');

	// CREATE CIRKULERO
	var defaultDate = moment();
	defaultDate.set('day', 1);
	defaultDate.set('hour', 12);
	defaultDate.set('minute', 0);
	defaultDate.add(1, 'month');
	defaultDate.set('day', 6); // 6 = 5, We have to do this again due to varying month lengths
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
		select: [ 'id', 'name', 'deadline', 'open' ],
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
});
