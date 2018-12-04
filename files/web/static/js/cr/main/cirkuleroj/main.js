$(function () {
	if (userPerms['cirkuleroj.manage']) {
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
		// Direct reminders
		var insertDirectReminder = function () {
			var template = cloneTemplate('#template-reminder-direct');
			$.AdminBSB.input.activate(template);
			autosize(template.find('.autosize'));


			$('#reminders-direct').append(template);
		};
		insertDirectReminder();

		// List reminders
		var insertListReminder = function () {
			var template = cloneTemplate('#template-reminder-list');
			$.AdminBSB.input.activate(template);
			autosize(template.find('.autosize'));


			$('#reminders-list').append(template);
		};
		insertListReminder();
	}

	var archiveTable = $('#cirkuleroj-archive>tbody');
	var cirkulerojIds = Object.keys(pageData.cirkuleroj); // Sort descending
	cirkulerojIds.sort(function (a, b) {
		return b.id - a.id;
	});
	for (var i in cirkulerojIds) {
		var id = cirkulerojIds[i];
		var row = pageData.cirkuleroj[id];

		var idCol = document.createElement('td');
		idCol.textContent = id;
		var nameCol = document.createElement('td');
		nameCol.textContent = 'Cirkulero n-ro ' + id + ' de ' + row.name;
		var stateCol = document.createElement('td');
		var state;
		if (row.archive) {
			state = 'Preta (malnova arkivo)';
		} else if (row.published) {
			state = 'Preta';
		} else if (pageData.mayContribute) {
			if (row.open) {
				var timeNow = moment().unix();
				if (row.deadline > timeNow) {
					state = 'Malfermita';
				} else {
					state = 'Malfermita, post limdato';
				}
			} else {
				state = 'Fermita, ankoraŭ ne preta';
			}
		} else {
			state = 'Ankoraŭ ne preta';
		}
		stateCol.textContent = state;

		var tr = document.createElement('tr');
		tr.appendChild(idCol);
		tr.appendChild(nameCol);
		tr.appendChild(stateCol);

		tr.classList.add('clickable'); // TODO: Not all should be clickable
		$(tr).click(function () {
			var id = $(this).children()[0].innerHTML;
			var row = pageData.cirkuleroj[id];
			if (row.archive) {
				window.open('/d/cirkuleroj/' + id + '.pdf');
			} else {
				console.log('Not yet implemented'); // TODO
			}
		});

		archiveTable.append(tr);
	}
});