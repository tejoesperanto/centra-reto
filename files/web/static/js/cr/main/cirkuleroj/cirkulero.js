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
			var statisticsGroups = pageData.groups.statistics;
			statisticsGroups.push(null); // Remainder group
			for (var i in statisticsGroups) {
				var group = statisticsGroups[i];
				var contributorGroup;

				if (group === null) {
					var users = [];
					for (var n in cirkuleroInfo.contributors) {
						var group = cirkuleroInfo.contributors[n];
						if (group.hasStats || !group.users.length) { continue; }
						users = users.concat(group.users);
					}

					contributorGroup = {
						isRemainder: true,
						group: {
							name: 'Aliaj',
							members_allowed: true
						},
						users: users
					};
				} else {
					for (var n in cirkuleroInfo.contributors) {
						contributorGroup = cirkuleroInfo.contributors[n];
						if (contributorGroup.group.id === group.id) {
							contributorGroup.hasStats = true;
							break;
						}
					}
				}

				if (contributorGroup.users.length < 1) {
					continue; // Nothing to report on this group
				}

				contributorGroup.users.sort(function (a, b) {
					if (a.full_name_latin_sort < b.full_name_latin_sort) {
						return -1;
					} else {
						return 1;
					}
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

				template.find('.cirkulero-contrib-overview-name').text(contributorGroup.group.name);

				// Kontribuis
				var contribTitle = template.find('.cirkulero-contrib-overview-contributors-title');
				var contribList = template.find('.cirkulero-contrib-overview-contributors');
				if (contributors.length) {
					if (contributorGroup.group.members_allowed) {
						contribList.attr('start', contribIter);
					} else {
						var newEl = $('<ul class="cirkulero-contrib-overview-contributors"></ul>');
						contribList.replaceWith(newEl);
						contribList = newEl;
					}

					contribTitle.text('Kontribuis (' + contributors.length + '/' + totalUsers + '):');
					for (var n in contributors) {
						var user = contributors[n];
						if (contributorGroup.group.members_allowed) { contribIter++; }

						var li = document.createElement('li');
						contribList.append(li);

						var anchor = document.createElement('a');
						li.appendChild(anchor);
						anchor.href = '/aktivulo/' + user.email;
						anchor.target = '_blank';
						anchor.textContent = user.long_name;

						var span = document.createElement('span');
						li.appendChild(span);
						if (user.long_name) {
							span.textContent = ' – ' + user.group_name;
						} else {
							span.textContent = 'Nealiĝinto – ' + user.group_name;
						}
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
							span.textContent = 'Nealiĝinto – ' + user.group_name;
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

			// Contributions
			var contributionsGroups = [];
			var remainder = [];
			for (var i in cirkuleroInfo.contributions) {
				var contrib = cirkuleroInfo.contributions[i];
				
				var index = null;
				for (var n = 0; n < pageData.groups.appear.length; n++) {
					var group = pageData.groups.appear[n];
					if (contrib.user.group_id === group.id) {
						index = n;
						break;
					}
				}

				if (index) {
					if (!contributionsGroups[index]) {
						contributionsGroups[index] = [];
					}
					contributionsGroups[index].push(contrib);
				} else {
					remainder.push(contrib);
				}
			}
			contributionsGroups.push(remainder);
			var contributions = [];
			for (var i in contributionsGroups) {
				var group = contributionsGroups[i];
				group.sort(function (a, b) {
					if (a.full_name_latin_sort < b.full_name_latin_sort) {
						return -1;
					} else {
						return 1;
					}
				});
				contributions = contributions.concat(group);
			}

			var handleFaro = function (contrib, name) {
				var fares = template.find('.cirkulero-contrib-' + name);
				var faresList = fares.find('ul');
				if (contrib[name].length < 1) {
					contrib[name].push('-');
				}
				for (var n in contrib[name]) {
					var faro = contrib[name][n];
					var li = document.createElement('li');
					faresList.append(li);
					li.textContent = faro;
				}
			};

			var contribsEl = $('#cirkulero-contribs');
			for (var i in contributions) {
				var contrib = contributions[i];

				var template = cloneTemplate('#template-cirkulero-contrib');
				contribsEl.append(template);

				var prefix = 'contrib-' + i;
				template.find('.panel-heading')[0].id = prefix;
				template.find('.collapsed')
					.attr('href', '#' + prefix + '-collapse')
					.attr('aria-controls', prefix + '-collapse');
				template.find('.panel-collapse')
					.attr('id', prefix + '-collapse')
					.attr('aria-labelledby', prefix);

				var title = contrib.user.long_name || 'Nealiĝinto';
				title += ' – ' + contrib.user.role;
				if (contrib.user.role_comment) {
					title += ' – ' + contrib.user.role_comment;
				}
				template.find('.cirkulero-contrib-title').text(title);

				handleFaro(contrib, 'faris');
				handleFaro(contrib, 'faras');
				handleFaro(contrib, 'faros');

				var commentEl = template.find('.cirkulero-contrib-comment');
				if (contrib.comment) {
					var textarea = commentEl.find('textarea');
					if (!pageData.editor) {
						textarea.attr('readonly', true);
					}
					textarea.val(contrib.comment);
				} else {
					commentEl.remove();
				}
			}

			$('#loader').hide();

			var cirkulero = $('#cirkulero');
			cirkulero.show(0, function () {
				$.AdminBSB.input.activate(cirkulero);
				autosize(cirkulero.find('.autosize'));
			});
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
