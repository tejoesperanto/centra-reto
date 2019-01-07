if ($.fn.dataTable) {
    $.fn.dataTable.ext.errMode = 'throw';
}

$('#cr-logout').click(function (e) {
    e.preventDefault();
    
    performAPIRequest('post', '/api/user/logout')
        .then(function (res) {
            if (!res.success) { return; }

            window.location.reload();
        });
});

$('#cr-login').click(function (e) {
	e.preventDefault();

	window.location.href = '/ensaluti?' + encodeURI(window.location.pathname + window.location.search);
});
