$(function () {
	moment.locale('eo');

	var tableData = setUpDataTable({
		el: '#cirkuleroj-table',
		method: 'post'	,
		url: '/api/cirkuleroj/list',
		select: [ 'id', 'name', 'deadline', 'open' ],
		defaultOrder: [ 2, 'asc' ],
		options: {
			searching: false
		},
		globalWhere: [{
            col: 'published',
            val: 0,
            type: '='
        }],
        dataFormatter: function (val, col) {
        	if (col.name === 'deadline') {
        		val = moment.unix(val).format('LLL');
        	}

        	return val;
        }
	});
	var table = tableData.table;
});
