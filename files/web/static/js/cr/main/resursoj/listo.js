$(function () {
	var resourceTable = $('#resources-list>tbody');
	var resourceIds = Object.keys(pageData.resource); // Sort descending
	resourceIds.sort(function (a, b) {
		return a - b;
	});
	for (var i in resourceIds) {
		var id = resourceIds[i];
		var row = pageData.resource[id];

		var idCol = document.createElement('td');
		idCol.textContent = id;
		var nameCol = document.createElement('td');
		nameCol.textContent = row.name;
		var descriptionCol = document.createElement('td');
		descriptionCol.textContent = row.description;
		var urlCol = document.createElement('td');
		var anchor = document.createElement('a');
		urlCol.appendChild(anchor);
		anchor.textContent = row.url;
		anchor.href = row.url;
		anchor.target = '_blank';

		var tr = document.createElement('tr');
		tr.appendChild(idCol);
		tr.appendChild(nameCol);
		tr.appendChild(descriptionCol);
		tr.appendChild(urlCol);

		resourceTable.append(tr);
	}
});