$(function () {
	autosize($('.autosize'));

	$('#deadline').text(moment.unix(pageData.cirkulero.deadline).format('LLL [UTC]'));

	var rolePicker = $('#cirkulero-role');
	var cirkuleroDiv = $('#cirkulero');

	var roles = Object.values(pageData.creditRoles);
	for (var i = 0; i < roles.length; i++) {
		var role = roles[i];

		// Add roles to role picker
		var option = document.createElement('option');
		option.textContent = role.user.name;
		option.value = role.group.id;
		rolePicker.append(option);
	}

	// Switch active contribution role
	var setRoleName = function () {
		var val = $(this).children(':selected').text();
		$('#role-name').text(val);
	};
	rolePicker.on('change', setRoleName);
	setRoleName.call(rolePicker);

	// Dynamic faris/faras/faros
	var insertCirkFaro = function (parent, after) {
		parent = $(parent);

		var template = cloneTemplate('#template-cirk-faro');
		$.AdminBSB.input.activate(template);
		var input = template.find('input');
		input.on('keydown', function (e) {
			if (e.which === 13) { // Newline
				insertCirkFaro(parent, $(this)).focus();
				e.preventDefault(); // No submission

			} else if (e.which === 8) { // Backspace
				if (parent.children().length === 1) { return; } // Don't remove the last input
				if (input.val().length === 0) {
					var focusEl = template.prev();
					if (!focusEl.length) { focusEl = template.next(); }
					template.remove();
					e.preventDefault(); // To prevent deleting in the next field
					focusEl.find('input').focus();
				}
			}
		});

		if (after) {
			template.insertAfter(after.parents('li.cirk-faro'));
		} else {
			parent.append(template);
		}

		return input;
	}
	insertCirkFaro('#cirkulero-faris');
	insertCirkFaro('#cirkulero-faras');
	insertCirkFaro('#cirkulero-faros');

	// Form submission
	$('#cirkulero').submit(function (e) {
		e.preventDefault();

		var button = $('#cirkulero-submit');

		swal({
			title: 'Kontribuo al cirkulero',
			text: 'Ĉu vi certas, ke vi pretas sendi vian cirkulerkontribuon?',
			buttons: [
				'Nuligi',
				{
					text: 'Konservi',
					closeModal: false
				}
			]
		}).then(function (modalE) {
			if (!modalE) { return; }

			button.attr('disabled', true);

			var faris = [];
			$('#cirkulero-faris').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faris.push(value); }
			});

			var faras = [];
			$('#cirkulero-faras').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faris.push(value); }
			});

			var faros = [];
			$('#cirkulero-faros').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faris.push(value); }
			});


			var apiData = {
				cirkulero_id: pageData.cirkulero.id,
				group_id: parseInt(rolePicker.val(), 10),
				faris: faris,
				faras: faras,
				faros: faros
			};

			var userRoleComment = $('#cirkulero-user_role_comment').val();
			if (userRoleComment) { apiData.user_role_comment = userRoleComment; }

			var comment = $('#cirkulero-comment').val();
			if (comment) { apiData.comment = comment; }

			performAPIRequest('post', '/api/cirkuleroj/contribute', apiData)
				.then(function (res) {
					swal.stopLoading();
					button.removeAttr('disabled', false);
					if (!res.success) { return; }

					swal({
						icon: 'success',
						title: 'Sendis kontribuon',
						text: 'Via kontribuo al cirkulero n-ro ' + pageData.cirkulero.id + ' estis sukcese sendita.\nVi povas sendi plian kontribuon se vi havas plurajn rolojn.'
					});
				});
		});
	});
});
