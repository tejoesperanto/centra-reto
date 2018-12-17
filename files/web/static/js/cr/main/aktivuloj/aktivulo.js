$(function () {
	$('#private-info-button').click(function () {
		$('#private-info-alert').remove();
		$('#user-image>img').removeClass('blur');
	});

	$('#edit-profile-picture').click(function () {
		var template = cloneTemplate('#template-edit-profile-picture');

		var dropzone;

		var uploadHandler = function (xhr, formData, files) {
			var settings = {
				method: 'post',
				url: '/api/user/set_profile_picture',
				data: {
					public: template.find('.edit-profile-picture-publicity').is(':checked')
				},
				handleErrors: false
			}

			if (xhr) {
				settings.files = [];
				settings.files['picture'] = files[0];
				
				settings.xhrEvents = {
					progress: function (e, xhr) {
						dropzone._updateFilesUploadProgress(files, xhr, e);
					},
					load: function (e, xhr) {
						dropzone._finishedUploading(files, xhr, e);
					},
					error: function (e, xhr) {
						dropzone._handleUploadError(files, xhr);
					}
				};
			}

			var finalFn;
			performAPIRequest(settings)
				.then(function (res) {
					finalFn = function () {
						swal({
							icon: 'success',
							title: 'Profilbildo sukcese ŝanĝita',
							text: ' ', // Necessary to fix issues with missing body
							buttons: false,
							timer: 1500
						}).then(function () {
							window.location.reload();
						})
					};
				})
				.catch(function (err) {
					finalFn = function () {
						showError(err);
					};
				})
				.finally(function () {
					swal.stopLoading();
					if (settings.files) {
						window.setTimeout(finalFn, 1000); // Let the upload animation finish
					} else {
						finalFn();
					}
				});
		};

		template.find('.edit-profile-picture-upload').dropzone({
			maxFilesize: 3,
			maxFiles: 1,
			init: function () {
				dropzone = this;

				this.on('maxfilesexceeded', function (file) {
					this.removeAllFiles();
					this.addFile(file);
				});
			},
			url: 'INVALID',
			acceptedFiles: 'image/*',
			autoProcessQueue: false,
			customHandler: uploadHandler
		});

		template.find('.remove-profile-picture-button').click(function () {
			swal({
				title: 'Forigo de profilbildo',
				text: 'Ĉu vi certas, ke vi volas forigi vian profilbildon?',
				buttons: [
					'Nuligi',
					{
						text: 'Forigi',
						closeModal: false
					}
				]
			}).then(function (isConfirm) {
				if (!isConfirm) { return; }

				performAPIRequest('post', '/api/user/remove_profile_picture')
					.then(function (res) {
						swal.stopLoading();
						if (!res.success) { return; }
						window.location.reload();
					})
			});
		});

		swal({
			title: 'Ŝanĝi profilbildon',
			content: template[0],
			buttons: [
				'Fermi',
				{
					text: 'Konservi',
					closeModal: false
				}
			]
		}).then(function (isConfirm) {
			if (!isConfirm) { return; }

			if (dropzone.getQueuedFiles().length > 0) {
				dropzone.processQueue();
			} else {
				uploadHandler();
			}
		});
	});
});
