$(function () {
	$('.cr-pronouns-list input').click(function (e) {
		$('#form-pronouns_list').prop('checked', true);
	});

	$('#form-pronouns_none').click(function (e) {
		$('.cr-pronouns-list input').prop('checked', false);
	});

    $('#finish_profile').validate({
    	rules: {
    		'pronouns_list[]': {
    			required: '#form-pronouns_list:checked',
    			minlength: 1
    		},
            'pet_name': {
                notEqualTo: '#form-nickname'
            },
            'full_name_native': {
                notEqualTo: '#form-full_name_latin'
            }
    	},
        messages: {
            'pet_name': {
                notEqualTo: 'Nur indiku kromnomon se ĝi ne estas parto de via plena nomo'
            },
            'full_name_native': {
                notEqualTo: 'Nur indiku nomon per via propra skribsistemo se ĝi ne estas skribita per latinaj literoj'
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
            $('#submit-button').attr('disabled', true);
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
                    if (!res.success) {
                        $('#submit-button').removeAttr('disabled');
                        return;
                    }

                    window.location.href = '/';
                });
        }
    });
});
