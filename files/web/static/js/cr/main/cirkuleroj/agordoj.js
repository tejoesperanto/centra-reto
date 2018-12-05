$(function () {
	// GENERAL SETTINGS
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

	var groupFields = [ 'contribute', 'appear', 'statistics', 'responsible' ];
	// Obtain existing groups
	performAPIRequest('post', '/api/cirkuleroj/get_groups')
		.then(function (res) {
			if (!res.success) { return; }

			$('#manage-cirkuleroj-loader').remove();

			// Add the groups
			for (var x in groupFields) {
				var field = groupFields[x];
				var groupIds = res[field];
				var el = $('#manage-cirkuleroj-form-groups-' + field);

				for (var y in groupIds) {
					var id = groupIds[y];
					var group = pageData.groups[groupsIndices[id]];
					el.tagsinput('add', { id: id, name: group.name });
				}
			}

			$('#manage-cirkuleroj-form').show();
		});

	// Form submission handler
	$('#manage-cirkuleroj-form').submit(function (e) {
		e.preventDefault();

		var data = {};

		for (let x in groupFields) {
			var field = groupFields[x];
			var el = $('#manage-cirkuleroj-form-groups-' + field);
			var items = el.tagsinput('items');
			var groups = [];
			for (var y in items) {
				var group = items[y];
				groups.push(group.id);
			}
			data[field] = groups;
		}

		var button = $('#manage-cirkuleroj-form-button');
		button.attr('disabled', true);
		performAPIRequest('post', '/api/cirkuleroj/update_groups', data)
			.then(function (res) {
				button.removeAttr('disabled');
				if (!res.success) { return; }
				var confirmation = $('#manage-cirkuleroj-form-button-confirmation');
				confirmation.show();
				window.setTimeout(function () {
					confirmation.fadeOut();
				}, 400);
			});
	});

	// REMINDER SETTINGS
	var handleReminderCommon = function (options) {
		var template = $(options.template);
		var parent = $(options.parent);
		var data = options.data;
		var updateCb = options.updateCb;

		if (data) {
			template[0].dataset.id = data.id;
			template[0].dataset.deltaTime = data.delta_time;
			var days = Math.floor(data.delta_time / 86400);
			var hours = Math.round((data.delta_time % 86400) / 3600);
			template.find('[name="days"]').val(days);
			template.find('[name="hours"]').val(hours);
			template.find('[name="message"]').val(data.message);
			template.find('[name="list_email"]').val(data.list_email);
		}

		template.find('form').submit(function (e) {
			e.preventDefault();

			var deltaTime = template.find('[name="days"]').val() * 86400;
			deltaTime += template.find('[name="hours"]').val() * 3600;

			var apiData = {
				id: parseInt(template[0].dataset.id, 10),
				delta_time: deltaTime,
				message: template.find('[name="message"]').val()
			};

			var listEmail = template.find('[name="list_email"]').val();
			if (listEmail) { apiData.list_email = listEmail; }

			swal({
				title: 'Ĝisdatigo de cirkulera memorigo',
				text: 'Ĉu vi certas, ke vi volas konservi la ŝanĝojn?',
				buttons: [
					'Nuligi',
					{
						text: 'Konservi',
						closeModal: false
					}
				]

			}).then(function (modalE) {
				if (!modalE) { return; }

				template.find('button[type="submit"]').attr('disabled', true);

				updateCb(apiData)
					.then(function (res) {
						swal.stopLoading();
						template.find('button[type="submit"]').removeAttr('disabled');
						if (!res.success) { return; }
						template[0].dataset.deltaTime = deltaTime;
						swal.close();

						// Sort the reminders
						parent.children().sortElements(function (a, b) {
							return parseInt(b.dataset.deltaTime, 10) - parseInt(a.dataset.deltaTime, 10);
						});
					});
			});
		});

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
		var parent = $('#reminders-direct');
		
		handleReminderCommon({
			template: template,
			parent: parent,
			data: data,
			updateCb: function (apiData) {
				return performAPIRequest('post', '/api/cirkuleroj/update_reminder_direct', apiData);
			}
		});

		parent.append(template);
		return template;
	};

	// List reminders
	var insertListReminder = function (data) {
		var template = cloneTemplate('#template-reminder-lists');
		var parent = $('#reminders-lists');

		handleReminderCommon({
			template: template,
			parent: parent,
			data: data,
			updateCb: function (apiData) {
				return performAPIRequest('post', '/api/cirkuleroj/update_reminder_list', apiData);
			}
		});

		parent.append(template);
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