$.fn.dataTable.ext.errMode = 'throw';

$('#cr-logout').click(function(e) {
    e.preventDefault();
    
    $.post('/api/user/logout', function (res) {
        if (!res.success) {
            showError(res);
            return;
        }

        window.location.reload();
    }).fail(function (err) {
        showError(err);
    });
});
