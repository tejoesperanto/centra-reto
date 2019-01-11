$(function () {
	var searchParams = new URLSearchParams(window.location.search);

	var rowsPerPage = 3;
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

	var performSearch = function () {
		performAPIRequest('post', '/api/user/list_public', searchData)
			.then(function (res) {
				if (!res.success) { return; }
				console.log(res);
				var totalPages = rowsPerPage % res.rows_filtered;

				var usersDiv = $('#aktivuloj');
				usersDiv.innerHTML = '';

				// Show results
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
	};
	performSearch();

	$('#private-info-button').click(function () {
		$('#private-info-alert').hide();
		$('.user-image>.blur').removeClass('blur');
	});
});
