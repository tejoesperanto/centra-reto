$(function () {
	var searchParams = new URLSearchParams(window.location.search);

	var rowsPerPage = 12;
	var currentPage = parseInt(searchParams.get('p'), 10) || 1;

	var searchData = {
		select: [
			'name',
			'email',
			'has_picture',
			'picture_private',
			'groups'
		],
		limit: rowsPerPage,
		offset: (currentPage - 1) * rowsPerPage,
		order: [{
			col: 'full_name_latin_sort',
			type: 'asc'
		}]
	};
	if (searchParams.has('s')) {
		var searchVal = '%' + searchParams.get('s') + '%';
		searchData.search = [
			{
				col: 'full_name_latin',
				val: searchVal
			},
			{
				col: 'email',
				val: searchVal
			}
		];
	}

	performAPIRequest('post', '/api/user/list_public', searchData)
		.then(function (res) {
			if (!res.success) { return; }
			var totalPages = Math.ceil(res.rows_filtered / rowsPerPage);

			var usersDiv = $('#aktivuloj');
			usersDiv.innerHTML = '';

			// Show results
			if (res.data.length === 0) {
				var template = cloneTemplate('#template-no-users');
				usersDiv.append(template);
			}

			var hasPrivateInfo = false;
			for (var i in res.data) {
				var user = res.data[i];

				var template = cloneTemplate('#template-user');
				usersDiv.append(template);

				template.find('.tmpl-user-name').text(user.name);
				template.find('.aktivulo-link').attr('href', '/aktivuloj/' + user.email);

				var imgDiv = template.find('.user-image');
				var imgEl = null;
				if (user.has_picture) {
					imgEl = document.createElement('img');
					imgEl.src = '/img/aktivulo/' + user.email + '/256.png';

					if (user.picture_private) {
						imgEl.classList.add('blur');
					}
				} else {
					var html = jdenticon.toSvg(user.name, 128);
					imgEl = $(html)[0];
					imgEl.classList.add('cr-user-picture');
				}
				imgEl.setAttribute('width', 128);
				imgEl.setAttribute('height', 128);
				imgDiv.append(imgEl);
				if (user.picture_private) {
					hasPrivateInfo = true;
				}

				var groupsEl = template.find('.tmpl-user-groups');
				for (var n in user.groups) {
					var group = user.groups[n];

					var span = document.createElement('span');
					span.textContent = group;
					span.classList.add('label', 'bg-green');
					groupsEl.append(span);
					var textNode = document.createTextNode(' ');
					groupsEl.append(textNode);
				}
			}

			if (hasPrivateInfo) {
				$('#private-info-alert').show();
			}

			// Pagination
			if (totalPages > 1) {
				var pagination = $('#pagination');

				for (var n = 0; n <= totalPages; n++) {
					var li = document.createElement('li');
					li.classList.add('paginate_button');

					var a = document.createElement('a');

					var pageId;
					if (n === 0) { // Previous page
						a.textContent = 'Antaŭa';
						pageId = currentPage - 1;
					} else if (n === totalPages) { // Next page
						a.textContent = 'Venonta';
						pageId = currentPage + 1;
					} else { // Page number
						a.textContent = n;
						pageId = n;
					}

					var newSearchParams = new URLSearchParams(searchParams);
					newSearchParams.set('p', pageId);
					if (pageId < 1) {
						li.classList.add('disabled');
					} else if (pageId === currentPage) {
						li.classList.add('active');
					} else {
						a.href = location.pathname + '?' + newSearchParams;
					}

					li.appendChild(a);
					pagination.append(li);
				}
			} else {
				$('#pagination-row').remove();
			}
		});

	$('#private-info-button').click(function () {
		$('#private-info-alert').hide();
		$('.user-image>.blur').removeClass('blur');
	});

	$('#search-form').submit(function (e) {
		e.preventDefault();

		var search = $('#aktivulo-search').val()
		if (search.length > 0) {
			searchParams.set('s', search);	
		} else {
			searchParams.delete('s');
		}

		window.location.search = '?' + searchParams;
	});

	$('#aktivulo-search').val(searchParams.get('s'));
});
