if ($.fn.dataTable) {
    $.fn.dataTable.ext.errMode = 'throw';
}

$('#cr-logout').click(function(e) {
    e.preventDefault();
    
    performAPIRequest('post', '/api/user/logout')
        .then(function (res) {
            if (!res.success) { return; }

            window.location.reload();
        });
});
