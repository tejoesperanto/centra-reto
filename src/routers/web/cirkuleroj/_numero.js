import * as cirkulero from '../../../api/cirkulero';

async function numero (req, res, next) {
	const id = parseInt(req.params.id, 10);
	if (!Number.isSafeInteger(id)) {
		next(); // 404
		return;
	}

	// Try to find the cirkulero in the archive
	let stmt = CR.db.cirkuleroj.prepare('select 1 from cirkuleroj_arkivo where id = ?');
	let row = stmt.get(id);

	if (row) {
		res.redirect(302, '/d/cirkuleroj/' + id + '.pdf');
		return;
	}

	// Try to find the cirkulero
	stmt = CR.db.cirkuleroj.prepare('select id, name, deadline, open, published from cirkuleroj where id = ?');
	row = stmt.get(id);

	if (!row) {
		next(); // 404
		return;
	}

	if (row.published) { // Show the final cirkulero
		const data = {
			title: `Cirkulero n-ro ${row.id} por ${row.name}`,
			scripts: [
				'/plugins/chartjs/Chart.bundle.min.js',
				'/js/cr/main/cirkuleroj/cirkulero.js',
				'/plugins/autosize/autosize.min.js'
			],
			page: {
				cirkulero: row,
				editor: false
			},
			pageDataObj: {
				cirkulero: row,
				editor: false
			}
		};
		await res.sendRegularPage('cirkuleroj/cirkulero', data);
		return;
	}

	let mayContribute = false;
	if (req.user) { mayContribute = await cirkulero.mayUserContributeToCirkuleroj(req.user); }

	if (row.open) { // The cirkulero is open to contributions ... from the right people
		if (!mayContribute) {
			if (req.user) {
				next(); // 404
			} else {
				res.redirect(303, '/ensaluti?' + req.originalUrl);
			}
			return;
		}

		const roles = await cirkulero.getUserCirkuleroGroups(req.user);
		const creditRoles = await cirkulero.getUserCirkuleroContributionGroups(req.user);

		// Get the user's existing contributions
		const stmt = CR.db.cirkuleroj.prepare('select group_id, user_role_comment, faris, faras, faros, comment from cirkuleroj_contributions where cirkulero_id = ? and user_id = ?');
		const rows = stmt.all(row.id, req.user.id);

		const contribs = [];
		for (let row of rows) {
			contribs.push({
				group_id: row.group_id,
				user_role_comment: row.user_role_comment,
				faris: JSON.parse(row.faris),
				faras: JSON.parse(row.faras),
				faros: JSON.parse(row.faros),
				comment: row.comment
			});
		}

		const data = {
			title: `Kontribui al cirkulero n-ro ${row.id} por ${row.name}`,
			scripts: [
				'/js/cr/main/cirkuleroj/kontribui.js',
				'/plugins/bootstrap-select/js/bootstrap-select.min.js',
				'/plugins/autosize/autosize.min.js'
			],
			stylesheets: [
				'/plugins/bootstrap-select/css/bootstrap-select.min.css'
			],
			page: {
				cirkulero: row
			},
			pageDataObj: {
				cirkulero: row,
				roles: roles,
				creditRoles: creditRoles,
				contributions: contribs
			}
		};
		await res.sendRegularPage('cirkuleroj/kontribui', data);
		return;
	}

	next(); // 404
}

export default numero;
