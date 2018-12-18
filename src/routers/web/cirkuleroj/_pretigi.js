import * as cirkulero from '../../../api/cirkulero';
import url from 'url';

async function pretigi (req, res, next) {
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }
	
	const id = parseInt(req.params.id, 10);
	if (!Number.isSafeInteger(id)) {
		next(); // 404
		return;
	}

	// Try to find the cirkulero
	let stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, open, published, note from cirkuleroj where id = ? and published = 0');
	const cirk = stmt.get(id);

	if (!cirk) {
		next(); // 404
		return;
	}

	stmt = CR.db.cirkuleroj.prepare('select key, value from settings where key in ("publish_message", "publish_email")');
	const settings = stmt.all();
	let publishMessage;
	let publishEmail;
	for (let setting of settings) {
		switch (setting.key) {
			case 'publish_message':
			publishMessage = setting.value;
			break;
			case 'publish_email':
			publishEmail = setting.value;
		}
	}

	const data = {
		title: `Pretigi cirkuleron n-ro ${cirk.id} por ${cirk.name}`,
		scripts: [
			'/plugins/chartjs/Chart.bundle.min.js',
			'/plugins/autosize/autosize.min.js',
			'/js/cr/main/cirkuleroj/cirkulero.js'
		],
		page: {
			cirkulero: cirk,
			editor: true
		},
		pageDataObj: {
			cirkulero: cirk,
			editor: true,
			publishMessage: publishMessage,
			publishEmail: publishEmail,
			cirkURL: url.resolve(CR.conf.addressPrefix, `cirkuleroj/${cirk.id}`)
		}
	};
	await res.sendRegularPage('cirkuleroj/cirkulero', data);
}

export default pretigi;
