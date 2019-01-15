import User from '../../../api/user';
import * as CRUtil from '../../../util';

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
		aktivuloGroups.push(group.user.name);
	}
	aktivuloGroups.sort((a, b) => a.localeCompare(b, 'eo'));

	const publicOnly = !req.user; // If the user is not signed in we'll only be sending public info
	const pictureState = aktivulo.getPictureState();
	const picturePrivate = req.user ? pictureState === 1 : false;

	const aktivuloObj = {
		emailObfuscated: aktivulo.getObfuscatedEmail(),
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

	if (aktivuloObj.isSelf) {
		aktivuloObj.selfData = {
			picturePublic: pictureState === 2
		};
	}

	const data = {
		title: aktivuloObj.longName,
		stylesheets: [
			'/plugins/dropzone/dropzone.min.css'
		],
		scripts: [
			'/plugins/dropzone/dropzone.min.js',
			'/js/cr/main/aktivuloj/aktivulo.js'
		],
		page: {
			urlObfuscated: CRUtil.rot13(req.originalUrl),
			aktivulo: aktivuloObj
		},
		pageDataObj: {
			aktivulo: aktivuloObj
		}
	};
	await res.sendRegularPage('aktivuloj/aktivulo', data);
}

export default aktivulo;
