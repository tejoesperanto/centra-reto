$(function () {
	var archiveTable = $('#cirkuleroj-archive>tbody');
	var cirkulerojIds = Object.keys(pageData.cirkuleroj); // Sort descending
	cirkulerojIds.sort(function (a, b) {
		return b - a;
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
		var clickable = true;
		if (row.archive) {
			state = 'Preta (malnova arkivo)';
		} else if (row.published) {
			state = 'Preta';
		} else if (pageData.mayContribute) {
			var timeNow = moment().unix();
			if (row.deadline > timeNow) {
				state = 'Malfermita';
			} else {
				state = 'Malfermita, post limdato';
			}
		} else {
			state = 'Ankoraŭ ne preta';
			clickable = false;
		}
		if (clickable) {
			var anchor = document.createElement('a');
			stateCol.appendChild(anchor);
			anchor.textContent = state;
			anchor.href = '/cirkuleroj/' + id;
		} else {
			stateCol.textContent = state;
		}

		var tr = document.createElement('tr');
		tr.appendChild(idCol);
		tr.appendChild(nameCol);
		tr.appendChild(stateCol);

		archiveTable.append(tr);
	}
});