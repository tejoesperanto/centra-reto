$(function () {
	var rolePicker = $('#cirkulero-role');
	var cirkuleroDiv = $('#cirkulero');

	var roles = Object.values(pageData.creditRoles);
	for (var i = 0; i < roles.length; i++) {
		var role = roles[i];

		// Add roles to role picker
		var option = document.createElement('option');
		option.textContent = role.user.name;
		option.value = i;
		rolePicker.append(option);

		// Add the divs for the contributions
		var template = cloneTemplate('#template-cirkulero');
		template.find('.role-name').text(role.user.name);

		if (i > 0) { template.hide(); }
		cirkuleroDiv.append(template);
	}

	// Switch active contribution
	rolePicker.on('change', function (e) {
		cirkuleroDiv.children().hide();
		cirkuleroDiv.children().eq(this.value).show();
	});
});
