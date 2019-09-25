
$(function () {
	var submitButton = $('#vote-button');

	$('#vote-form').submit(function (e) {
		e.preventDefault();

		var apiData = {
			id: pageData.vote.id
		};

		if (pageData.vote.type === 'jns') {
			apiData.ballot = $('[name=vote]:checked').val();
		} else { // pr, utv
			var inputs = $('.vote');
			var values = [];
			for (var i = 0; i < inputs.length; i++) {
				var val = inputs[i].value;
				if (!val.length) { continue; }
				val = parseInt(val, 10);
				if (!Number.isSafeInteger(val)) {
					return swal({
						icon: 'warning',
						title: 'Nevalida balotilo',
						text: 'Bonvolu enmeti nur entjerojn',
						button: 'Bone'
					});
				}
				values.push({
					i: i,
					val: val
				});
			}
			values.sort(function (a, b) {
				return a.val - b.val;
			});

			var ballot = apiData.ballot = [];

			var lastVal = null;
			var n = -1;
			for (var i in values) {
				var val = values[i];
				if (val.val !== lastVal) { n++; }
				lastVal = val.val;
				if (!(n in ballot)) { ballot[n] = []; }
				ballot[n].push(val.i);
			}

			if (pageData.vote.type === 'utv') {
				for (var i in ballot) {
					var entry = ballot[i];
					if (entry.length > 1) {
						return swal({
							icon: 'warning',
							title: 'Nevalida balotilo',
							text: 'Pluraj opcioj ne rajtas havi la saman numeron',
							button: 'Bone'
						});
					}
				}
			}
		}

		swal({
			title: 'Ĉu vi certas pri viaj elektoj?',
			buttons: [
				'Nuligi',
				{
					text: 'Voĉdoni',
					closeModal: false
				}
			]
		}).then(function (isConfirm) {
			if (!isConfirm) { return; }

			submitButton.attr('disabled', true);

			performAPIRequest('post', '/api/votes/vote', apiData)
				.then(function (res) {
					if (!res.success) {
						return submitButton.attr('disabled', false);
					}
					
					swal.stopLoading();
					swal({
						icon: 'success',
						title: 'Vi sukcese voĉdonis, dankon!',
						buttons: 'Reveni'
					}).then(function () {
						location.href = '/vochdonado/retaj';
					});
				});
		});
	});
});
