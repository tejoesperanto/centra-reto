import url from 'url';

async function ensaluti (req, res, next) { // eslint-disable-line no-unused-vars
	if (req.user) {
		const searchString = url.parse(req.url, true).search;
		let redirectUrl = '/';
		if (searchString) { redirectUrl = searchString.slice(1); }

		res.redirect(303, redirectUrl);
		return;
	}

	await res.sendFullPage('ensaluti');
}

export default ensaluti;
