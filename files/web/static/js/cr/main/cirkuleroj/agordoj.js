$(function () {
	// General settings
	// Group data
	var groupsSearch = new Bloodhound({
		local: pageData.groups,
		identify: function (obj) { return obj.id; },
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	var groupsInput = $('.manage-cirkuleroj-form-groups');
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

	// Reminder settings
	var handleReminderCommon = function (template, data) {
		if (data) {
			var days = Math.floor(data.delta_time / 86400);
			var hours = Math.round((data.delta_time % 86400) / 3600);
			template.find('[name="days"]').val(days);
			template.find('[name="hours"]').val(hours);
			template.find('[name="message"]').val(data.message);
			template.find('[name="list_email"]').val(data.list_email);
			template.find('button[type="submit"]').removeAttr('disabled');
		}

		$.AdminBSB.input.activate(template);
		var autosizeEls = template.find('.autosize');
		autosize(autosizeEls);
		window.setTimeout(function () {
			autosize.update(autosizeEls);
		}, 0); // Run when the thread is idle
	};
	// Direct reminders
	var insertDirectReminder = function (data) {
		var template = cloneTemplate('#template-reminder-direct');
		
		handleReminderCommon(template, data);

		$('#reminders-direct').append(template);
		return template;
	};

	// List reminders
	var insertListReminder = function (data) {
		var template = cloneTemplate('#template-reminder-lists');

		handleReminderCommon(template, data);

		$('#reminders-lists').append(template);
		return template;
	};

	// Insert existing reminders
	Promise.all([
		performAPIRequest('post', '/api/cirkuleroj/get_reminders_direct'),
		performAPIRequest('post', '/api/cirkuleroj/get_reminders_lists')
	]).then(function (res) {
		if (!res[0].success || !res[1].success) { return; }

		var remindersDirect = res[0].reminders;
		var remindersLists  = res[1].reminders;

		// Set up direct reminders
		$('#reminders-direct').html('');
		for (var i in remindersDirect) {
			var reminder = remindersDirect[i];
			insertDirectReminder(reminder);
		}
		// Set up list reminders
		$('#reminders-lists').html('');
		for (var i in remindersLists) {
			var reminder = remindersLists[i];
			insertListReminder(reminder);
		}
	})
});