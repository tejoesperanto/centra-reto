$(function () {
	var setUpCirkulero = function () {
		var apiData = { cirkulero_id: pageData.cirkulero.id };
		Promise.all([
			performAPIRequest('post', '/api/cirkuleroj/get_contributions', apiData),	
			performAPIRequest('post', '/api/cirkuleroj/get_groups', apiData)
		]).then(function (res) {
			if (!res[0].success || !res[1].success) { return; }

			var cirkuleroInfo = {
				contributions: res[0].contributions,
				groups: {
					contribute: res[1].contribute,
					appear: res[1].appear,
					statistics: res[1].statistics
				}
			};

			var getContribTitle = function (contrib) {
				var title = contrib.user.long_name || contrib.user.email;
				title += ' – ' + contrib.user.role;
				if (contrib.contrib.role_comment) {
					title += ' – ' + contrib.contrib.role_comment;
				}
				return title;
			};

			var actualContributions = [];
			for (var i in cirkuleroInfo.contributions) {
				var contrib = cirkuleroInfo.contributions[i];
				if (contrib.contrib !== null) {
					actualContributions.push(contrib);
				}
			}

			// STATISTICS OVERVIEW
			// General
			$('.data-contribs-total').text(actualContributions.length);
			$('.data-contribs-allowed').text(cirkuleroInfo.contributions.length);

			// Per statistics group
			var overview = $('#cirkulero-contrib-overview');

			var statisticsGroups = cirkuleroInfo.groups.statistics;

			var createStatsHandler = function (group) {
				var contribs = [];
				for (var n in cirkuleroInfo.contributions) {
					var contrib = cirkuleroInfo.contributions[n];
					if (!group && contrib.hasStats) { continue; }
					if (!group) { // Remainder
						contrib.hasStats = true;
						contribs.push(contrib);
						continue;
					}
					// Not remainder
					if (group.id !== contrib.user.group_id && group.children.indexOf(contrib.user.group_id) === -1) {
						continue;
					}
					contrib.hasStats = true;
					contribs.push(contrib);
				}

				if (!contribs.length) { return; } // Group is empty, no action needed

				if (!group) { // Remainder
					group = {
						name: 'Aliaj'
					};
				}

				var contributors = [];
				var nonContributors = [];

				for (var n in contribs) {
					var contrib = contribs[n];
					if (contrib.contrib) {
						contributors.push(contrib);
					} else {
						nonContributors.push(contrib);
					}
				}

				var template = cloneTemplate('#template-cirkulero-contrib-overview');
				overview.append(template);
				template.find('.cirkulero-contrib-overview-name').text(group.name);

				var insertContributorGroup = function (options) {
					if (options.contribs.length) {
						options.titleEl.text(options.titleText + ' (' + options.contribs.length + '/' + contribs.length + '):');

						for (var n in options.contribs) {
							var contrib = options.contribs[n];

							var li = document.createElement('li');
							options.listEl.append(li);

							if (contrib.user.long_name) {
								var anchor = document.createElement('a');
								li.appendChild(anchor);
								anchor.href = '/aktivuloj/' + contrib.user.email;
								anchor.target = '_blank';
								anchor.textContent = contrib.user.long_name;
							}

							var span = document.createElement('span');
							li.appendChild(span);
							if (contrib.user.long_name) {
								span.textContent = ' – ' + contrib.user.role;
							} else {
								span.textContent = contrib.user.email + ' – ' + contrib.user.role;
							}
						}
					} else {
						options.titleEl.remove();
						options.listEl.remove();
					}
				};

				insertContributorGroup({
					titleEl: template.find('.cirkulero-contrib-overview-contributors-title'),
					listEl: template.find('.cirkulero-contrib-overview-contributors'),
					contribs: contributors,
					titleText: 'Kontribuis'
				});

				insertContributorGroup({
					titleEl: template.find('.cirkulero-contrib-overview-noncontributors-title'),
					listEl: template.find('.cirkulero-contrib-overview-noncontributors'),
					contribs: nonContributors,
					titleText: 'Ne kontribuis'
				});

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
						rotation: .5 * Math.PI
					}
				});
			};
			for (var i in statisticsGroups) {
				createStatsHandler(statisticsGroups[i]);
			}
			createStatsHandler(null); // Remainder

			// CONTRIBUTIONS
			var handleFaro = function (template, contrib, name) {
				var fares = template.find('.cirkulero-contrib-' + name);
				var faresListEl = fares.find('ul');
				var faresList = contrib.contrib[name].slice();
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

			var appearGroups = cirkuleroInfo.groups.appear;
			var contribIter = 1;
			var createContribHandler = function (group) {
				var contribs = [];
				for (var i in actualContributions) {
					var contrib = actualContributions[i];
					if (contrib.hasEntry) { continue; }
					if (!group) { // Remainder
						contrib.hasEntry = true;
						contribs.push(contrib);
						continue;
					}
					// Not remainder
					if (group.id !== contrib.user.group_id && group.children.indexOf(contrib.user.group_id) === -1) {
						continue;
					}
					contrib.hasEntry = true;
					contribs.push(contrib);
				}

				if (!contribs.length) { return; } // Group is empty, no action needed

				if (!group) { // Remainder
					group = {
						name: 'Aliaj'
					};
				}

				var contribsEl = $('#cirkulero-contribs');
				for (var i in contribs) {
					var contrib = contribs[i];

					var template = cloneTemplate('#template-cirkulero-contrib');
					template[0].dataset.edited = contrib.contrib.modified_by_admin;
					template[0].dataset.userId = contrib.user.id;
					template[0].dataset.groupId = contrib.user.group_id;
					contribsEl.append(template);

					var prefix = 'contrib-' + contribIter;
					template.find('.panel-heading')[0].id = prefix;
					template.find('.collapsed')
						.attr('href', '#' + prefix + '-collapse')
						.attr('aria-controls', prefix + '-collapse');
					template.find('.panel-collapse')
						.attr('id', prefix + '-collapse')
						.attr('aria-labelledby', prefix);

					var title = getContribTitle(contrib);
					template.find('.cirkulero-contrib-title').text(title);

					handleFaro(template, contrib, 'faris');
					handleFaro(template, contrib, 'faras');
					handleFaro(template, contrib, 'faros');

					var commentEl = template.find('.cirkulero-contrib-comment textarea');
					commentEl.val(contrib.contrib.comment || '');

					// Editing
					var editButton = template.find('.cirkulero-contrib-edit-button');
					if (!pageData.editor) {
						editButton.parent().remove();
					} else {
						editButton.click(function () {
							var panel = $(this).parents('.panel');
							var contrib;
							for (var i in cirkuleroInfo.contributions) {
								contrib = cirkuleroInfo.contributions[i];
								var userId  = parseInt(panel[0].dataset.userId,  10);
								var groupId = parseInt(panel[0].dataset.groupId, 10);
								if (contrib.user.id === userId && contrib.user.group_id === groupId) { break; }
							}

							var template = cloneTemplate('#template-edit-contrib-modal');
							template.find('.data-name').text(contrib.user.long_name);

							var faroj = [ 'faris', 'faras', 'faros' ];
							for (var n in faroj) {
								var faroName = faroj[n];
								var faroList = contrib.contrib[faroName];
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

							template.find('.cirkulero-contrib-comment textarea').val(contrib.contrib.comment);
							template.find('.cirkulero-contrib-user_role_comment input').val(contrib.contrib.role_comment);

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
										contrib.contrib[faroName][n] = this.textContent;
									});
								}

								var comment = template.find('.cirkulero-contrib-comment textarea').val().trim();
								if (!comment || comment.length < 1) { comment = null; }
								contrib.contrib.comment = comment;
								var commentElPanel = panel.find('.cirkulero-contrib-comment textarea')
								commentElPanel.val(comment);

								var roleComment = template.find('.cirkulero-contrib-user_role_comment input').val().trim();
								if (!roleComment || roleComment.length < 1) { roleComment = null;}
								contrib.contrib.role_comment = roleComment;
								var roleCommentPanel = panel.find('.cirkulero-contrib-title');
								roleCommentPanel.text(getContribTitle(contrib));

								window.setTimeout(function () {
									autosize.update(commentElPanel);
									// Necessary to update the label
									commentElPanel.removeAttr('disabled');
									commentElPanel.trigger('focus').trigger('blur');
									commentElPanel.attr('disabled', true);
								}, 0);
							});
						});
					}
				}

				contribIter++;
			};
			for (var i in appearGroups) {
				createContribHandler(appearGroups[i]);
			}
			createContribHandler(appearGroups[i]); // Remainder

			// PUBLISH
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
						for (var i in cirkuleroInfo.contributions) {
							var contrib = cirkuleroInfo.contributions[i];
							if (!contrib.edited) { continue; }
							contribs.push({
								user_id: contrib.user.id,
								group_id: contrib.user.group_id,
								faris: contrib.contrib.faris,
								faras: contrib.contrib.faras,
								faros: contrib.contrib.faros,
								comment: contrib.contrib.comment,
								user_role_comment: contrib.contrib.role_comment
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

			// Show the cirkulero
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
			text: 'Ĉu vi certas, ke vi volas jam nun finpretigi tiun ĉi cirkuleron? Tiu ĉi ago tuj fermos kontribuojn.',
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
		});
	} else {
		setUpCirkulero();
	}
});
