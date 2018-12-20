$(function () {
	var unsavedChanges = false;
	var checkUnsavedChanges = function () {
		var els = $('form[data-saved=false]');
		unsavedChanges = !!els.length;
	};
	window.onbeforeunload = function (e) {
		if (unsavedChanges) {
			e.preventDefault();
			e.returnValue = 'Ĉu vi certas ke vi volas forlasi la paĝon?\nEventualaj ŝanĝoj ne estos konservitaj.';
			return e.returnValue;	
		}
	};

	autosize($('.autosize'));

	$('#deadline').text(moment.unix(pageData.cirkulero.deadline).format('LLL [UTC]'));

	var rolePicker = $('#cirkulero-role');
	var cirkuleroDiv = $('#cirkulero');

	// Dynamic faris/faras/faros
	var insertCirkFaro = function (parent, after) {
		parent = $(parent);
		if (after) { after = $(after); }

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

			template.parents('form[data-saved]')[0].dataset.saved = false;
			checkUnsavedChanges();
		});

		if (after) {
			template.insertAfter(after.parents('li.cirk-faro'));
		} else {
			parent.append(template);
		}

		return input;
	};

	// Form submission
	var handleSubmit = function (e) {
		e.preventDefault();

		var self = $(this);

		var button = self.find('button[type=submit]');

		swal({
			title: 'Kontribuo al cirkulero',
			text: 'Ĉu vi certas, ke vi pretas sendi vian cirkulerkontribuon?\nVi povas ĉiam reveni por redakti vian kontribuon ĝis la limdato.',
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
			self.find('[name=faris]').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faris.push(value); }
			});

			var faras = [];
			self.find('[name=faras]').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faras.push(value); }
			});

			var faros = [];
			self.find('[name=faros]').children().each(function () {
				var value = $(this).find('input').val();
				if (value) { faros.push(value); }
			});


			var apiData = {
				cirkulero_id: pageData.cirkulero.id,
				group_id: parseInt(rolePicker.val(), 10),
				faris: faris,
				faras: faras,
				faros: faros
			};

			var userRoleComment = self.find('[name=user_role_comment]').val();
			if (userRoleComment) { apiData.user_role_comment = userRoleComment; }

			var comment = self.find('[name=comment]').val();
			if (comment) { apiData.comment = comment; }

			performAPIRequest('post', '/api/cirkuleroj/contribute', apiData)
				.then(function (res) {
					swal.stopLoading();
					button.removeAttr('disabled', false);
					if (!res.success) { return; }

					if (self.hasClass('contrib-new')) {
						self.removeClass('contrib-new');
						self[0].dataset.id = apiData.group_id;
						self[0].dataset.saved = true;
						checkUnsavedChanges();
						insertNewContribution();
					}

					swal({
						icon: 'success',
						title: 'Sendis kontribuon',
						text: 'Via kontribuo al cirkulero n-ro ' + pageData.cirkulero.id + ' estis sukcese sendita.\nVi povas sendi pliajn kontribuojn se vi havas plurajn rolojn.'
					});
				});
		});
	};

	var insertNewContribution = function (willHaveData) {
		var template = cloneTemplate('#template-cirkulero');
		if (!willHaveData) {
			template.addClass('contrib-new');
			insertCirkFaro(template.find('[name=faris]'));
			insertCirkFaro(template.find('[name=faras]'));
			insertCirkFaro(template.find('[name=faros]'));
		}
		checkUnsavedChanges();
		template.find('[name=user_role_comment],[name=comment]').on('input', function () {
			template[0].dataset.saved = false;
			checkUnsavedChanges();
		});
		template.submit(handleSubmit);
		template.hide();

	cirkuleroDiv.append(template);
		return template;
	};
	insertNewContribution();

	var roles = Object.values(pageData.creditRoles);
	for (var i in roles) {
		var role = roles[i];

		// Add roles to role picker
		var option = document.createElement('option');
		option.textContent = role.user.name;
		option.value = role.group.id;
		rolePicker.append(option);
	}

	for (var i in pageData.contributions) {
		var contrib = pageData.contributions[i];
		// Insert contribution role templates
		var template = insertNewContribution(true);
		template[0].dataset.id = contrib.group_id;
		template.find('[name=user_role_comment]').val(contrib.user_role_comment);
		template.find('[name=comment]').val(contrib.comment);

		var faris = template.find('[name=faris]');
		for (var n in contrib.faris) {
			var faro = contrib.faris[n];
			var el = insertCirkFaro(faris);
			el.val(faro);
		}
		if (contrib.faris.length === 0) { insertCirkFaro(faris); }

		var faras = template.find('[name=faras]');
		for (var n in contrib.faras) {
			var faro = contrib.faras[n];
			var el = insertCirkFaro(faras);
			el.val(faro);
		}
		if (contrib.faras.length === 0) { insertCirkFaro(faras); }

		var faros = template.find('[name=faros]');
		for (var n in contrib.faros) {
			var faro = contrib.faros[n];
			var el = insertCirkFaro(faros);
			el.val(faro);
		}
		if (contrib.faros.length === 0) { insertCirkFaro(faros); }
	}

	// Switch active contribution role
	var setRoleName = function () {
		var val = $(this).children(':selected').text();
		$('#role-name').text(val);
		cirkuleroDiv.children().hide();
		var el = cirkuleroDiv.children('[data-id=' + this.value + ']');
		if (!el[0]) {
			el = cirkuleroDiv.children('.contrib-new');
		}
		el.show();
	};
	rolePicker.on('change', setRoleName);
	setRoleName.call(rolePicker[0]);
});
