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
			$('#create-vote-form-numWinners,#create-vote-form-opts')
				.prop('disabled', true)
				.prop('required', false);
			$('#create-vote-form-quorum,#create-vote-form-majority')
				.prop('disabled', false)
				.prop('required', true);
		} else {
			$('#create-vote-form-numWinners,#create-vote-form-opts')
				.prop('disabled', false)
				.prop('required', true);
			$('#create-vote-form-quorum,#create-vote-form-majority')
				.prop('disabled', true)
				.prop('required', false);
		}
	});

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

		console.log(apiData);
	});
});
