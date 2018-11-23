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
            $('#submit-button').attr('disabled', true);
            // TODO: Some sort of indicator that something's going on
            var data = $(form).serialize();
            $.post('/api/user/activate', data, function (res) {
                if (!res.success) {
                    showError(res);
                    $('#submit-button').removeAttr('disabled');
                    return;
                }

                $.post('/api/user/login', data, function (res) {
                    if (!res.success) {
                        showError(res);
                        $('#submit-button').removeAttr('disabled');
                        return;
                    }

                    swal({
                        title: 'Bonvenon',
                        type: 'success',
                        text: 'Vi sukcesis aliĝis al Centra Reto.',
                        confirmButtonText: 'Bone'
                    }, function () {
                        window.location = '/';
                    });
                }).fail(function (err) {
                    showError(err);
                    $('#submit-button').removeAttr('disabled');
                });
            }).fail(function (err) {
                showError(err);
                $('#submit-button').removeAttr('disabled');
            });
        }
    });
});
