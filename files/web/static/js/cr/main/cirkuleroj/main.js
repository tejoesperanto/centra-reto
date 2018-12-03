$(function () {
	// Group data
	var groupsSearch = new Bloodhound({
		local: pageData.groups,
		identify: function (obj) { return obj.id; },
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	var groupsInput = $('#manage-cirkuleroj-form-groups');
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

	var archiveTable = $('#cirkuleroj-archive>tbody');
	for (var i in pageData.cirkuleroj) {
		var row = pageData.cirkuleroj[i];

		var idCol = document.createElement('td');
		idCol.textContent = row.id;
		var nameCol = document.createElement('td');
		nameCol.textContent = 'Cirkulero n-ro ' + row.id + ' de ' + row.name;
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
		tr.classList.add('clickable');
		tr.appendChild(idCol);
		tr.appendChild(nameCol);
		tr.appendChild(stateCol);

		$(tr).click(function () {
			var id = $(this).children()[0].innerHTML;
			window.open('/d/cirkuleroj/' + id + '.pdf');
		});
		archiveTable.append(tr);
	}
});