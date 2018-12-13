$(function () {
    // Hotfix for broken focus detection in AdminBSB
    $('#email-input').blur();

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
            var button = $('#submit-button');
            button.attr('disabled', true);
            // TODO: Some sort of indicator that something's going on
            var data = serializeToObj(form);

            performAPIRequest('post', '/api/user/activate', data)
                .then(function (res) {
                    if (!res.success) {
                        button.removeAttr('disabled');
                        return;
                    }

                    performAPIRequest('post', '/api/user/login', data)
                        .then(function (res) {
                            if (!res.success) {
                                button.removeAttr('disabled');
                                return;
                            }

                            swal({
                                title: 'Bonvenon',
                                icon: 'success',
                                text: 'Vi sukcesis aliĝis al Centra Reto.',
                                button: 'Bone'
                            }).then(function () {
                                window.location = '/';
                            });
                        });
                });
        }
    });
});
