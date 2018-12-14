import User from '../../../api/user';

async function aktivulo (req, res, next) {
	const aktivulo = User.getUserByEmail(req.params.email);
	if (!aktivulo || !aktivulo.enabled || !aktivulo.hasCompletedInitialSetup()) {
		next(); // 404
		return;
	}

	const aktivuloDetails = await aktivulo.getNameDetails();

	const aktivuloGroupsRaw = await aktivulo.getGroups();
	const aktivuloGroups = [];
	for (let group of aktivuloGroupsRaw.values()) {
		if (!group.user.active) { continue; }
		if (!group.group.public) { continue; }
		aktivuloGroups.push(group);
	}
	aktivuloGroups.sort((a, b) => a.user.name.localeCompare(b.user.name, 'eo'));

	const publicOnly = !req.user; // If the user is not signed in we'll only be sending public info
	const picturePrivate = req.user ? aktivulo.getPictureState() === 1 : false;

	const aktivuloObj = {
		email: aktivulo.email,
		details: aktivuloDetails,
		longName: await aktivulo.getLongName(),
		shortName: await aktivulo.getShortName(),
		briefName: await aktivulo.getBriefName(),
		groups: aktivuloGroups,
		isSelf: req.user && req.user.id === aktivulo.id,
		hasPicture: aktivulo.hasPicture(publicOnly),
		pictures: aktivulo.getPictureURLs(publicOnly),
		picturePrivate: picturePrivate,
		hasPrivateData: picturePrivate,
		randomPronoun: aktivulo.getRandomPronoun()
	};

	const data = {
		title: await aktivulo.getLongName(),
		scripts: [
			'/js/cr/main/aktivuloj/aktivulo.js'
		],
		page: {
			aktivulo: aktivuloObj
		}
	};
	await res.sendRegularPage('aktivuloj/aktivulo', data);
}

export default aktivulo;
