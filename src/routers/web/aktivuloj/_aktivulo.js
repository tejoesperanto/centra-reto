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

	const aktivuloObj = {
		email: aktivulo.email,
		details: aktivuloDetails,
		longName: await aktivulo.getLongName(),
		shortName: await aktivulo.getShortName(),
		briefName: await aktivulo.getBriefName(),
		groups: aktivuloGroups
	};

	const data = {
		title: await aktivulo.getLongName(),
		page: {
			aktivulo: aktivuloObj
		}
	};
	await res.sendRegularPage('aktivuloj/aktivulo', data);
}

export default aktivulo;
