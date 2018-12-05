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
	stmt = CR.db.cirkuleroj.prepare('select published from cirkuleroj where id = ?');
	row = stmt.get(id);

	if (!row) {
		next(); // 404
		return;
	}

	// TODO: Show the cirkulero
	res.send('Trovita');
}

export default numero;
