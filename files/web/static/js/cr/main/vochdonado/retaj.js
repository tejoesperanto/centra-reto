$(function () {
	var autosizeEls = $('.autosize');
	autosize(autosizeEls);

	// Group data
	var groupsIndices = {};
	for (var i = 0; i < pageData.groups.length; i++) {
		var group = pageData.groups[i];
		groupsIndices[group.id] = i;
	}
	var groupsSearch = new Bloodhound({
		local: pageData.groups,
		identify: function (obj) { return obj.id; },
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	var groupsInput = $('#create-vote-form-groups');
	groupsInput.tagsinput({
		itemValue: 'id',
		itemText: 'name',
		typeaheadjs: {
			name: 'groups',
			displayKey: 'name',
			source: groupsSearch.ttAdapter()
		}
	});
	// Disable submitting by pressing enter in tags input field
	var ttInput = groupsInput.parent().find('.tt-input');
	ttInput.keypress(function (e) {
		if (e.which == 13) {
			e.preventDefault();
		}
	});

	var defaultDate = moment();
	defaultDate.hour(12);
	defaultDate.minute(0);
	defaultDate.add(15, 'days');
	$('#create-vote-form-timeTo').datetimepicker({
		locale: 'eo',
		minDate: moment(),
		defaultDate: defaultDate
	});

	$('#create-vote-form-type').change(function () {
		var type = $(this).val();

		if (type === 'jns') {
			$('#create-vote-form-opts')
				.prop('disabled', true)
				.prop('required', false);
			$('#create-vote-form-quorum,#create-vote-form-majority')
				.prop('disabled', false)
				.prop('required', true);
		} else {
			$('#create-vote-form-opts')
				.prop('disabled', false)
				.prop('required', true);
			$('#create-vote-form-quorum,#create-vote-form-majority')
				.prop('disabled', true)
				.prop('required', false);
		}

		$('#create-vote-form-numWinners')
			.prop('disabled', type !== 'utv')
			.prop('required', type === 'utv');
	});

	var submitButton = $('#create-vote-form-submit');
	$('#create-vote-form').submit(function (e) {
		e.preventDefault();

		var apiData = {
			name: $('#create-vote-form-name').val(),
			description: $('#create-vote-form-description').val(),
			type: $('#create-vote-form-type').val(),
			timeTo: $('#create-vote-form-timeTo').data('DateTimePicker').date().unix(),
			secret: $('#create-vote-form-secret').is(':checked'),
			groups: $('#create-vote-form-groups').tagsinput('items')
				.map(function (x) {
					return x.id;
				})
		};

		if (apiData.type === 'jns') {
			switch ($('#create-vote-form-quorum').val()) {
			case '1/2':
				apiData.quorum = 1/2;
				break;
			case '2/3':
				apiData.quorum = 2/3;
				break;
			default:
				apiData.quorum = 0;
			}

			switch ($('#create-vote-form-majority').val()) {
			case 'plej':
				apiData.majority = 1/2;
				apiData.majorityMustBeGreater = true;
				break;
			case '2/3':
				apiData.majority = 2/3;
				apiData.majorityMustBeGreater = false;
				break;
			default:
				apiData.majority = 0;
				apiData.majorityMustBeGreater = false;
			}
		} else {
			apiData.numWinners = parseInt($('#create-vote-form-numWinners').val(), 10);
			apiData.opts = $('#create-vote-form-opts').val()
				.split(/\r?\n/g)
				.map(function (x) {
					return x.trim();
				})
				.filter(function (x) {
					return x.length > 0;
				});
		}

		swal({
			title: 'Ĉu vi certas, ke vi volas krei novan voĉdonon?',
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

			performAPIRequest('post', '/api/votes/create', apiData)
				.then(function (res) {
					submitButton.attr('disabled', false);
					if (!res.success) { return; }
					
					swal.stopLoading();
					swal.close();
					location.reload();
				});
		});
	});

	$('.about-vote').click(function () {
		var tr = $(this).parents('tr');
		var id = tr.data('id');
		var modalTemplate = cloneTemplate('#about-vote-modal-' + id);

		modalTemplate.find('.about-vote-modal-delete').click(function () {
			swal({
				title: 'Ĉu vi certas, ke vi volas forigi la voĉdonon?',
				buttons: [
					'Nuligi',
					{
						text: 'Forigi',
						closeModal: false
					}
				]
			}).then(function (isConfirm) {
				if (!isConfirm) { return; }

				performAPIRequest('post', '/api/votes/delete', { id: id })
					.then(function (res) {
						swal.stopLoading();
						if (!res.success) { return; }
						location.reload();
					});
			});
		});

		modalTemplate.find('.about-vote-modal-deadline').click(function () {
			var deadlineModal = cloneTemplate('.vote-deadline-modal');
			var form = deadlineModal.find('form');
			var input = form.find('input');

			var timeTo = moment.unix(tr.data('timeto'));

			input.datetimepicker({
				locale: 'eo',
				minDate: timeTo,
				defaultDate: timeTo
			});

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
				title: 'Ŝovo de limhoro',
				content: deadlineModal[0],
				buttons: [
					'Nuligi',
					{
						text: 'Ŝovi',
						closeModal: false
					}
				]
			}).then(function (isConfirm) {
				if (!isConfirm) { return; }

				var newTimeTo = input.data('DateTimePicker').date().unix();

				performAPIRequest('post', '/api/votes/extend', {
					id: id,
					timeTo: newTimeTo
				}).then(function (res) {
					swal.stopLoading();
					if (!res.success) { return; }
					location.reload();
				});
			});
		});
		
		swal({
			title: 'Pri voĉdono',
			content: modalTemplate[0]
		});
	});
});
