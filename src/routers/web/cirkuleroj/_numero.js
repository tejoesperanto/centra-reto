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
				'/js/cr/main/cirkuleroj/cirkulero.js'
			],
			page: {
				cirkulero: row
			},
			pageDataObj: {
				cirkulero: row
			}
		};
		await res.sendRegularPage('cirkuleroj/cirkulero', data);
		return;
	}

	let mayContribute = false;
	if (req.user) { mayContribute = await req.user.mayContributeToCirkuleroj(); }

	if (row.open) { // The cirkulero is open to contributions ... from the right people
		if (!mayContribute) {
			if (req.user) {
				next(); // 404
			} else {
				res.redirect(303, '/ensaluti?' + req.originalUrl);
			}
			return;
		}

		const data = {
			title: `Kontribui al cirkulero n-ro ${row.id} por ${row.name}`,
			scripts: [
				'/js/cr/main/cirkuleroj/kontribui.js'
			],
			page: {
				cirkulero: row
			},
			pageDataObj: {
				cirkulero: row
			}
		};
		await res.sendRegularPage('cirkuleroj/kontribui', data);
		return;
	}

	next();
}

export default numero;
