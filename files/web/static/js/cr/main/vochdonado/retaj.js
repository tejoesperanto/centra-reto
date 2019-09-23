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
		} else {
			$('#create-vote-form-numWinners,#create-vote-form-opts')
				.prop('disabled', false)
				.prop('required', true);
		}
	});
});
