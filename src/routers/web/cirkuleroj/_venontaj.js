import * as cirkulero from '../../../api/cirkulero';

async function venontaj (req, res, next) {
	const groups = await cirkulero.getGroups();

	const data = {
		title: 'Venontaj cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/venontaj.js',
			'/plugins/jquery-datatable/jquery.dataTables.js',
			'/js/jquery.dataTables.eo.js',
			'/plugins/jquery-datatable/skin/bootstrap/js/dataTables.bootstrap.min.js',
			'/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
			'/plugins/autosize/autosize.min.js'
		],
		stylesheets: [
			'/plugins/jquery-datatable/skin/bootstrap/css/dataTables.bootstrap.min.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput-typeahead.css',
			'/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css'
		],
		pageDataObj: {
			groups: groups
		}
	};
	await res.sendRegularPage('cirkuleroj/venontaj', data);
}

export default venontaj;
