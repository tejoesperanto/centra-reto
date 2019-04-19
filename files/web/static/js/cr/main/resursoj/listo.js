$(function () {
	var resourceTable = $('#resources-list>tbody');
	var resources = pageData.resource.sort(function (a, b) { // Sort ascending
		return a.name < b.name ? -1 : 1;
	});
	for (var row of resources) {
		var nameCol = document.createElement('td');
		nameCol.textContent = row.name;
		var descriptionCol = document.createElement('td');
		descriptionCol.textContent = row.description;
		descriptionCol.style.whiteSpace = "pre";
		var urlCol = document.createElement('td');
		var anchor = document.createElement('a');
		urlCol.appendChild(anchor);
		anchor.textContent = row.url;
		anchor.href = row.url;
		anchor.target = '_blank';

		var tr = document.createElement('tr');
		tr.appendChild(nameCol);
		tr.appendChild(descriptionCol);
		tr.appendChild(urlCol);

		resourceTable.append(tr);
	}
});