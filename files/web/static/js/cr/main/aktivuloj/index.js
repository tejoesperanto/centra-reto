$(function () {
	var searchData = {
		select: [
			'name',
			'email',
			'has_picture',
			'picture_private',
			'groups'
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
			});
	};
	performSearch();

	$('#private-info-button').click(function () {
		$('#private-info-alert').hide();
		$('.user-image>.blur').removeClass('blur');
	});
});
