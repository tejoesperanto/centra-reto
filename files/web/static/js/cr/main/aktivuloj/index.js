$(function () {
	var searchData = {
		select: [
			'name'
		],
		limit: 20,
		order: [{
			col: 'full_name_latin_sort',
			type: 'asc'
		}]
	};

	var performSearch = function () {
		performAPIRequest('post', '/api/user/list_public', searchData)
			.then(function (res) {
				if (!res.success) { return; }

				var usersDiv = $('#aktivuloj');
				usersDiv.innerHTML = '';

				for (var i in res.data) {
					var user = res.data[i];

					var template = cloneTemplate('#template-user');
					usersDiv.append(template);
				}
			});
	};

	performSearch();
});
