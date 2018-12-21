$(function () {
	// DETAILS
	// Default settings
	if (pageData.userDetails.pronouns) {
		var pronounsEls = {
			'ĝi': $('#details-pronouns_list_ghi'),
			'li': $('#details-pronouns_list_li'),
			'ri': $('#details-pronouns_list_ri'),
			'ŝi': $('#details-pronouns_list_shi')
		};
		for (var i in pageData.userDetails.pronouns) {
			var pronoun = pageData.userDetails.pronouns[i];

			var el = pronounsEls[pronoun];
			el.prop('checked', true);
		}
	}

	$('.cr-pronouns-list input').click(function (e) {
		$('#details-pronouns_list').prop('checked', true);
	});

	$('#details-pronouns_none').click(function (e) {
		$('.cr-pronouns-list input').prop('checked', false);
	});

	$('#change-details').validate({
    	rules: {
    		'pronouns_list[]': {
    			required: '#details-pronouns_list:checked',
    			minlength: 1
    		}
    	},
        highlight: function (input) {
            $(input).parents('.form-line').addClass('error');
            if (input.type === 'radio') {
            	$(input).parent().addClass('error');
            } else if (input.type === 'checkbox') {
            	$(input).parent().parent().addClass('error');
            }
        },
        unhighlight: function (input) {
            $(input).parents('.form-line').removeClass('error');
            if (input.type === 'radio') {
            	$(input).parent().removeClass('error');
            } else if (input.type === 'checkbox') {
            	$(input).parent().parent().removeClass('error');
            }
        },
        errorPlacement: function (error, element) {
            $(element).parents('.input-group').append(error);
            if (element[0].type === 'radio') {
            	error.insertBefore(element);
            } else if (element[0].type === 'checkbox') {
            	element.parent().parent().append(error);
            }
        },
        submitHandler: function (form) {
            var button = $('#details-button');
            button.attr('disabled', true);
            // TODO: Some sort of indicator that something's going on
            
            var formData = $(form).serializeArray();
            var data = {};

            for (var i in formData) {
            	var field = formData[i];

            	if (field.value.length === 0) { continue; }

            	switch (field.name) {
            		case 'full_name_latin':
            			data.full_name_latin = field.value;
            			break;
            		case 'full_name_native':
            			data.full_name_native = field.value;
            			break;
            		case 'full_name_latin_sort':
            			data.full_name_latin_sort = field.value;
            			break;
            		case 'nickname':
            			data.nickname = field.value;
            			break;
            		case 'pet_name':
            			data.pet_name = field.value;
            			break;
            		case 'pronouns':
            			if (field.value === 'none') {
            				data.pronouns = null;
            			} else if (field.value === 'list') {
            				data.pronouns = [];
            			}
            			break;
            		case 'pronouns_list[]':
            			data.pronouns.push(field.value);
            			break;
            	}
            }

            if (data.pronouns instanceof Array) {
        		data.pronouns = data.pronouns.join(',');
        	}

            performAPIRequest('post', '/api/user/initial_setup', data)
                .then(function(res) {
                    button.removeAttr('disabled');
                    if (!res.success) { return; }

                    swal({
                    	icon: 'success',
                    	title: 'Informoj pri vi ĝisdatigitaj',
                    	button: 'Fermi'
                    });
                });
        }
    });

	// EMAIL
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

			performAPIRequest('post', '/api/user/change_email', apiData, false)
				.then(function (res) {
					swal({
						icon: 'success',
						title: 'Retpoŝtadreso ŝanĝita',
						button: 'Fermi'
					});

					$('#leftsidebar .email').text(apiData.email);
				})
				.catch(function (err) {
					if (err.error === 'EMAIL_TAKEN') {
						swal({
					        title: 'Retpoŝtadreso jam uzata',
					        icon: 'error',
					        button: 'Bone'
					    });
					} else {
						showError(err);
					}
				})
				.finally(function () {
					button.removeAttr('disabled');
					swal.stopLoading();
				});
		});
	});

	// PASSWORD
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
});
