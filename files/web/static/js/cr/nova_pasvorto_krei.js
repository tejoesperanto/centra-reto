$(function () {
	$('#password-main').focus(); // For some reason autofocus doesn't work, we'll do this instead

	$('#reset').validate({
		rules: {
            'confirm': {
                equalTo: '[name="password"]'
            }
        },
        highlight: function (input) {
            $(input).parents('.form-line').addClass('error');
        },
        unhighlight: function (input) {
            $(input).parents('.form-line').removeClass('error');
        },
        errorPlacement: function (error, element) {
            $(element).parents('.input-group').append(error);
            $(element).parents('.form-group').append(error);
        },
        submitHandler: function (form) {
            // TODO: Some sort of indicator that something's going on
            var button = $('#submit-button');
            button.attr('disabled', true);
             
            var data = {
            	email: $('#email').text(),
            	password: $('#password-main').val(),
                key: $('#key').text()
            };

            performAPIRequest('post', '/api/user/reset_password_key', data)
            	.then(function (res) {
            		button.removeAttr('disabled');

            		if (!res.success) { return; }

            		swal({
            			icon: 'success',
            			title: 'Nova pasvorto kreita',
            			text: 'Via nova pasvorto estis efektivigita. Vi nun povas ensaluti.'
            		}).then(function () {
            			window.location.href = '/ensaluti';
            		});
            	});
        }
	});
});
