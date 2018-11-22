$(function () {
    $('#sign_up').validate({
        rules: {
            'terms': {
                required: true
            },
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
            $('#submit-button').attr('disabled', true);
            // TODO: Some sort of indicator that something's going on
            var data = $(form).serialize();
            $.post('/api/user/activate', data, function (data) {
                if (data.success) {
                    // TODO: Log in
                    window.location = '/';
                } else {
                    showError(data);
                    $('#submit-button').attr('disabled', false);
                }
            });
        }
    });
});
