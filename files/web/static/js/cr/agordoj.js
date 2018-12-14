$(function () {
	var passwordValidator = $('#change-password').validate({
		rules: {
			'password-confirm': {
				equalTo: '#password-new'
			}
		},
		highlight: function (input) {
			$(input).parents('.form-line').addClass('error');
		},
		unhighlight: function (input) {
			$(input).parents('.form-line').removeClass('error');
		},
		errorPlacement: function (error, element) {
			$(element).parent().after(error);
		},
		submitHandler: function (form) {
			swal({
				title: 'Ŝanĝo de pasvorto',
				text: 'Ĉu vi certas, ke vi volas ŝanĝi vian pasvorton?',
				buttons: [
					'Nuligi',
					{
						text: 'Ŝanĝi',
						closeModal: false
					}
				]
			}).then(function (isConfirm) {
				if (!isConfirm) { return; }

				var apiData = {
	                password_old: $('#password-old').val(),
	                password_new: $('#password-new').val()
	            };

	            var button = $('#password-button');
	            button.attr('disabled', true);

				performAPIRequest('post', '/api/user/change_password', apiData, false)
					.then(function (res) {
						swal({
							icon: 'success',
							title: 'Pasvorto ŝanĝita',
							button: 'Fermi'
						});
						form.reset();
					})
					.catch(function (err) {
						if (err.error === 'WRONG_OLD_PASSWORD') {
							swal.close();
							passwordValidator.showErrors({
								password_old: 'Malĝusta pasvorto'
							});
						} else {
							showError(err);
						}
					})
					.finally(function () {
						button.removeAttr('disabled');
						swal.stopLoading();
					});
			})
		}
	});

	$('#change-email').submit(function (e) {
		e.preventDefault();

		swal({
			title: 'Ŝanĝo de retpoŝtadreso',
			text: 'Ĉu vi certas, ke vi volas ŝanĝi vian retpoŝtadreson?',
			buttons: [
				'Nuligi',
				{
					text: 'Ŝanĝi',
					closeModal: false
				}
			]
		}).then(function (isConfirm) {
			if (!isConfirm) { return; }

			var apiData = {
				email: $('#email').val()
			};

			var button = $('#email-button');
			button.attr('disabled', true);

			performAPIRequest('post', '/api/user/change_email', apiData)
				.then(function (res) {
					button.removeAttr('disabled');
					swal.stopLoading();
					if (!res.success) { return; }

					swal({
						icon: 'success',
						title: 'Retpoŝtadreso ŝanĝita',
						button: 'Fermi'
					});

					$('#leftsidebar .email').text(apiData.email);
				});
		});
	});
});
