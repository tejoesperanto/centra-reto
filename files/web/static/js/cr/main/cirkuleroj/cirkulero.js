$(function () {
	var cirkuleroInfo = {};

	var getContribTitle = function (contrib) {
		var title = contrib.user.long_name || 'Nealiĝinto';
		title += ' – ' + contrib.user.role;
		if (contrib.user.role_comment) {
			title += ' – ' + contrib.user.role_comment;
		}
		return title;
	};

	var setUpCirkulero = function () {
		var apiData = { cirkulero_id: pageData.cirkulero.id };
		Promise.all([
			performAPIRequest('post', '/api/cirkuleroj/get_contributions', apiData),	
			performAPIRequest('post', '/api/cirkuleroj/list_contributors', apiData)
		]).then(function (res) {
			if (!res[0].success || !res[1].success) { return; }
			cirkuleroInfo.contributions = res[0].contributions;
			cirkuleroInfo.contributors  = res[1].groups;

			console.log(cirkuleroInfo);

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
				var faresListEl = fares.find('ul');
				var faresList = contrib[name].slice();
				if (faresList.length < 1) {
					faresList.push('-');
				}
				for (var n in faresList) {
					var faro = faresList[n];
					var li = document.createElement('li');
					faresListEl.append(li);
					li.textContent = faro;
				}
			};

			var contribsEl = $('#cirkulero-contribs');
			for (var i in contributions) {
				var contrib = contributions[i];

				var template = cloneTemplate('#template-cirkulero-contrib');
				template[0].dataset.contribIndex = i;
				template[0].dataset.edited = contrib.modified_by_admin;
				contribsEl.append(template);

				var prefix = 'contrib-' + i;
				template.find('.panel-heading')[0].id = prefix;
				template.find('.collapsed')
					.attr('href', '#' + prefix + '-collapse')
					.attr('aria-controls', prefix + '-collapse');
				template.find('.panel-collapse')
					.attr('id', prefix + '-collapse')
					.attr('aria-labelledby', prefix);

				var title = getContribTitle(contrib);
				template.find('.cirkulero-contrib-title').text(title);

				handleFaro(contrib, 'faris');
				handleFaro(contrib, 'faras');
				handleFaro(contrib, 'faros');

				var commentEl = template.find('.cirkulero-contrib-comment textarea');
				commentEl.val(contrib.comment || '');

				var editButton = template.find('.cirkulero-contrib-edit-button');
				if (pageData.editor) {
					editButton.click(function () {
						var panel = $(this).parents('.panel');
						var contribIndex = panel[0].dataset.contribIndex;
						var contrib = contributions[contribIndex];

						var template = cloneTemplate('#template-edit-contrib-modal');
						template.find('.data-name').text(contrib.user.long_name);

						var faroj = [ 'faris', 'faras', 'faros' ];
						for (var n in faroj) {
							var faroName = faroj[n];
							var faroList = contrib[faroName];
							var el = template.find('.edit-contrib-modal-' + faroName);

							if (!faroList.length) {
								el.remove();
								continue;
							}

							var ul = el.children('ul');

							for (var x in faroList) {
								var faro = faroList[x];

								var li = document.createElement('li');
								ul.append(li);
								li.contentEditable = true;
								li.textContent = faro;
								$(li).on('keydown', function (e) {
									if (e.which === 13) { // Enter
										e.preventDefault();
									}
								});
							}
						}

						template.find('.cirkulero-contrib-comment textarea').val(contrib.comment);
						template.find('.cirkulero-contrib-user_role_comment input').val(contrib.user.role_comment);

						window.setTimeout(function () {
							$.AdminBSB.input.activate(template);
							autosize(template.find('.cirkulero-contrib-comment textarea'));
						}, 0);

						swal({
							title: 'Redakti cirkulerkontribuon',
							content: template[0],
							buttons: [
								'Nuligi',
								'Konservi'
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							panel[0].dataset.edited = true;
							contrib.edited = true;

							for (var n in faroj) {
								var faroName = faroj[n];
								var contribList = panel.find('.cirkulero-contrib-' + faroName + '>ul').children();
								template.find('.edit-contrib-modal-' + faroName + '>ul>li').each(function (n) {
									contribList.eq(n).text(this.textContent);
									contrib[faroName][n] = this.textContent;
								});
							}

							var comment = template.find('.cirkulero-contrib-comment textarea').val().trim();
							if (!comment || comment.length < 1) { comment = null; }
							contrib.comment = comment;
							var commentElPanel = panel.find('.cirkulero-contrib-comment textarea')
							commentElPanel.val(comment);

							var roleComment = template.find('.cirkulero-contrib-user_role_comment input').val().trim();
							if (!roleComment || roleComment.length < 1) { roleComment = null;}
							contrib.user.role_comment = roleComment;
							var roleCommentPanel = panel.find('.cirkulero-contrib-title');
							roleCommentPanel.text(getContribTitle(contrib));

							window.setTimeout(function () {
								autosize.update(commentElPanel);
								// Necessary to update the label
								commentElPanel.removeAttr('disabled');
								commentElPanel.trigger('focus').trigger('blur');
								commentElPanel.attr('disabled', true);
							}, 0);
						})
					});
				} else {
					editButton.parent().remove();
				}
			}

			// Publish
			if (pageData.editor) {
				var msgCirkulero = 'Cirkulero n-ro ' + pageData.cirkulero.id + ' de ' + pageData.cirkulero.name;
				var msgStatistics = 'Al tiu ĉi cirkulero venis ' + cirkuleroInfo.contributions.length + ' kontribuoj.';

				var publishMessage = pageData.publishMessage;
				publishMessage = publishMessage.replace(/{{cirkulero}}/g, msgCirkulero);
				publishMessage = publishMessage.replace(/{{numero}}/g, pageData.cirkulero.id);
				publishMessage = publishMessage.replace(/{{monato}}/g, pageData.cirkulero.name);
				publishMessage = publishMessage.replace(/{{noto}}/g, pageData.cirkulero.note || '');
				publishMessage = publishMessage.replace(/{{ligilo}}/g, pageData.cirkURL);
				publishMessage = publishMessage.replace(/{{statistiko}}/g, msgStatistics);

				// Remove consecutive newlines
				publishMessage = publishMessage.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');

				var publishMessageEl = $('#cirkulero-publish_message');
				publishMessageEl.val(publishMessage);

				var publishEmailEl = $('#cirkulero-publish_email')
				publishEmailEl.val(pageData.publishEmail);

				var sendEmailEl = $('#cirkulero-send-email');
				sendEmailEl.change(function () {
					if ($(this).is(':checked')) {
						publishMessageEl.attr('required', true);
						publishEmailEl.attr('required', true);
					} else {
						publishMessageEl.removeAttr('required');
						publishEmailEl.removeAttr('required');
					}
				});

				publishMessageEl.add(publishEmailEl).on('input focus', function () {
					sendEmailEl.prop('checked', true).trigger('change');
				});

				$('#cirkulero-publish-form').submit(function (e) {
					e.preventDefault();

					swal({
						title: 'Publikigo de cirkulero',
						text: 'Ĉu vi certas, ke vi pretas publikigi la cirkuleron? Ne eblos poste fari ŝanĝojn.',
						buttons: [
							'Nuligi',
							{
								text: 'Publikigi',
								closeModal: false
							}
						]
					}).then(function (isConfirm) {
						if (!isConfirm) { return; }

						var publishMessage = publishMessageEl.val().trim();
						var publishEmail = publishEmailEl.val().trim();

						if (!sendEmailEl.is(':checked')) {
							publishMessage = null;
							publishEmail = null;
						}

						var contribs = [];
						for (var i in contributions) {
							var contrib = contributions[i];
							if (!contrib.edited) { continue; }
							contribs.push({
								user_id: contrib.user.id,
								group_id: contrib.user.group_id,
								faris: contrib.faris,
								faras: contrib.faras,
								faros: contrib.faros,
								comment: contrib.comment,
								user_role_comment: contrib.user.role_comment
							});
						}

						var apiData = {
							cirkulero_id: pageData.cirkulero.id,
							publish_message: publishMessage,
							publish_email: publishEmail,
							contribs: contribs
						};
						var button = $('#cirkulero-publish-button').attr('disabled', true);

						performAPIRequest('post', '/api/cirkuleroj/publish', apiData)
							.then(function (res) {
								button.removeAttr('disabled');
								swal.stopLoading();
								if (!res.success) { return; }

								swal({
									title: 'Cirkulero sukcese publikigita',
									icon: 'success',
									button: 'Al la cirkulero'
								}).then(function () {
									window.location.href = '/cirkuleroj/' + pageData.cirkulero.id;
								})
							});
					});					
				});
			}

			$('#loader').hide();

			var cirkulero = $('#cirkulero');
			cirkulero.show(0, function () {
				$.AdminBSB.input.activate(cirkulero);
				autosize($('body').find('.autosize'));

				if (!pageData.editor) {
					window.setTimeout(function () {
						$('.panel-collapse').collapse();
					}, 0);
				}
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
