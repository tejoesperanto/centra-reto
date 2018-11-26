$(function () {
	$('#users-table').DataTable({
		language: dataTablesEsp,
		responsive: true,
		processing: true,
		//serverSide: true
	});
	// TODO: Load data from /api/user/list
});
