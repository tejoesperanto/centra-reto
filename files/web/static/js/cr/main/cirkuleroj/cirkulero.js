$(function () {
	var cirkuleroInfo = {};

	var setUpCirkulero = function () {
		var apiData = { cirkulero_id: pageData.cirkulero.id };
		Promise.all([
			performAPIRequest('post', '/api/cirkuleroj/get_contributions', apiData),	
			performAPIRequest('post', '/api/cirkuleroj/list_contributors', apiData)
		]).then(function (res) {
			if (!res[0].success || !res[1].success) { return; }
			cirkuleroInfo.contributions = res[0].contributions;
			cirkuleroInfo.contributors  = res[1].groups;
			console.log(cirkuleroInfo); // TODO: Remove this
			console.log(pageData);

			// Set up the overview
			$('.data-contribs-total').text(cirkuleroInfo.contributions.length);

			var overview = $('#cirkulero-contrib-overview');
			var contribIter = 1;
			var contributorGroup;
			// TODO: “Aliaj”
			for (var i in pageData.groups.statistics) {
				var group = pageData.groups.statistics[i];

				for (var n in cirkuleroInfo.contributors) {
					contributorGroup = cirkuleroInfo.contributors[n];
					if (contributorGroup.group.id === group.id) { break; }
				}

				if (contributorGroup.users.length < 1) {
					continue; // Nothing to report on this group
				}

				contributorGroup.users.sort(function (a, b) {
					return a.full_name_latin_sort - b.full_name_latin_sort;
				});

				var contributors = [];
				var nonContributors = [];
				var totalUsers = contributorGroup.users.length;
				for (var n in contributorGroup.users) {
					var user = contributorGroup.users[n];
					if (user.contributed) {
						contributors.push(user);
					} else {
						nonContributors.push(user);
					}
				}

				var template = cloneTemplate('#template-cirkulero-contrib-overview');
				overview.append(template);

				template.find('.cirkulero-contrib-overview-name').text(group.nameBase);

				// Kontribuis
				var contribTitle = template.find('.cirkulero-contrib-overview-contributors-title');
				var contribList = template.find('.cirkulero-contrib-overview-contributors');
				if (contributors.length) {
					contribTitle.text('Kontribuis (' + contributors.length + '/' + totalUsers + '):');
					contribList.attr('start', contribIter);
					for (var n in contributors) {
						var user = contributors[n];
						contribIter++;

						var li = document.createElement('li');
						contribList.append(li);

						var anchor = document.createElement('a');
						li.appendChild(anchor);
						anchor.href = '/aktivulo/' + user.email;
						anchor.target = '_blank';
						anchor.textContent = user.long_name;

						var span = document.createElement('span');
						li.appendChild(span);
						span.textContent = ' – ' + user.group_name;
					}
				} else {
					contribTitle.remove();
					contribList.remove();
				}

				// Ne kontribuis
				var noContribTitle = template.find('.cirkulero-contrib-overview-noncontributors-title');
				var noContribList = template.find('.cirkulero-contrib-overview-noncontributors');
				if (nonContributors.length) {
					noContribTitle.text('Ne kontribuis (' + nonContributors.length + '/' + totalUsers + '):');
					for (var n in nonContributors) {
						var user = nonContributors[n];

						var li = document.createElement('li');
						noContribList.append(li);

						if (user.long_name) { // Has completed initial setup
							var anchor = document.createElement('a');
							li.appendChild(anchor);
							anchor.href = '/aktivulo/' + user.email;
							anchor.target = '_blank';
							anchor.textContent = user.long_name;
						}

						var span = document.createElement('span');
						li.appendChild(span);
						if (user.long_name) {
							span.textContent = ' – ' + user.group_name;
						} else {
							span.textContent = 'Nealiĝintulo – ' + user.group_name;
						}
					}
				} else {
					noContribTitle.remove();
					noContribList.remove();
				}

				// Chart
				var chartEl = template.find('.cirkulero-contrib-overview-chart');
				var chart = new Chart(chartEl[0].getContext('2d'), {
					type: 'pie',
					data: {
						datasets: [{
							data: [ contributors.length, nonContributors.length ],
							backgroundColor: [
								'#4CAF50', '#F44336'
							]
						}],
						labels: [
							'Kontribuintoj',
							'Nekontribuintoj'
						]
					},
					options: {
						responsive: false,
						rotation: Math.PI
					}
				});
			}

			$('#loader').hide();
			$('#cirkulero').show();
		});
	};

	if (pageData.editor && pageData.cirkulero.open) {
		swal({
			title: 'Pretigo de cirkulero',
			text: 'Ĉu vi certas, ke vi pretas pretigi tiun ĉi cirkuleron? Tiu ĉi ago tuj malfermos kontribuojn.',
			buttons: [
				'Nuligi',
				'Pretigi'
			]
		}).then(function (e) {
			if (!e) {
				window.location = '/cirkuleroj/venontaj';
				return
			}

			performAPIRequest('post', '/api/cirkuleroj/close', { cirkulero_id: pageData.cirkulero.id })
				.then(function (res) {
					if (!res.success) { return; }
					pageData.cirkulero.open = false;
					setUpCirkulero();
				});
		})
	} else {
		setUpCirkulero();
	}
});
