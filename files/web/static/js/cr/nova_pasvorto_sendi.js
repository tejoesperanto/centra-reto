$(function () {
	$('#reset').submit(function (e) {
		e.preventDefault();

		var email = $('#reset-form-email').val();

		var button = $('#submit-button');
		button.attr('disabled', true);

		// TODO: Some sort of indicator that something's going on

		performAPIRequest('post', '/api/user/reset_password_email', { email: email })
			.then(function (res) {
				button.removeAttr('disabled');
				if (!res.success) { return; }
				swal({
					icon: 'success',
					title: 'Retmesaĝo sendita',
					text: 'Ni ĵus sendis al vi retmesaĝon kun instrukcioj pri kiel nuligi vian pasvorton.',
					button: 'Fermi'
				}).then(function () {
					window.location.href = '/';
				})
			});
	});
});
