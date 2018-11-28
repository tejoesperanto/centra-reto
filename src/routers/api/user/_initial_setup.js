import { removeUnsafeCharsOneLine } from '../../../util';

async function user_initial_setup (req, res, next) {
	/**
	 * POST /initial_setup
	 * Performs the initial profile setup procedure
	 *
	 * Login required
	 * Initial setup not allowed
	 *
	 * Parameters:
	 * full_name_latin      (string)      The user's full name written in the latin alphabet in the native order
	 *                                    Length: 1-80
	 * [full_name_native]   (string)      The user's full name written in the native writing system in the native order
	 *                                    Length: 1-80
	 * full_name_latin_sort (string)      The user's full name written in the latin alphabet in sorted order
	 *                                    Length: 1-80
	 * nickname             (string)      (alvoknomo) The user's nickname (usually the personal name)
	 *                                    Length: 1-80
	 * [pet_name]           (string)      (kromnomo) The user's pet name (used as a nickname that's not part of the full name)
	 *                                    Length: 1-80
	 * pronouns             (string|null) The user's pronouns (li, ri, ŝi) in csv format. If null the user's nickname is used in generated text.
	 *
	 * Throws:
	 * ALREADY_COMPLETED The user has already completed the initial setup
	 */
	
	/** BEGIN INPUT VALIDATION */
	if (req.user.hasCompletedInitialSetup()) {
		res.sendAPIError('ALREADY_COMPLETED');
		return;
	}

	const fields = [
		'full_name_latin',
		'full_name_latin_sort',
		'nickname',
		'pronouns'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	let fullNameLatin = removeUnsafeCharsOneLine(req.body.full_name_latin);
	if (fullNameLatin.length < 1 || fullNameLatin.length > 80) {
		res.sendAPIError('INVALID_ARGUMENT', ['full_name_latin']);
		return;
	}

	let fullNameNative = null;
	if (req.body.full_name_native) {
		fullNameNative = removeUnsafeCharsOneLine(req.body.full_name_native);
		if (fullNameNative.length < 1 || fullNameNative.length > 80) {
			res.sendAPIError('INVALID_ARGUMENT', ['full_name_native']);
			return;
		}
	}

	let fullNameLatinSort = removeUnsafeCharsOneLine(req.body.full_name_latin_sort);
	if (fullNameLatinSort.length < 1 || fullNameLatinSort.length > 80) {
		res.sendAPIError('INVALID_ARGUMENT', ['full_name_latin_sort']);
		return;
	}

	let nickname = removeUnsafeCharsOneLine(req.body.nickname);
	if (nickname.length < 1 || nickname.length > 80) {
		res.sendAPIError('INVALID_ARGUMENT', ['nickname']);
		return;
	}

	let petName = null;
	if (req.body.pet_name) {
		petName = removeUnsafeCharsOneLine(req.body.pet_name);
		if (nickname.length < 1 || nickname.length > 80) {
			res.sendAPIError('INVALID_ARGUMENT', ['pet_name']);
			return;
		}
	}

	let pronouns = req.body.pronouns;
	if (pronouns !== null) {
		pronouns = pronouns.toString();
		const pronounsArr = pronouns.split(',');
		for (let pronoun of pronounsArr) {
			if (['li','ri','ŝi'].indexOf(pronoun) === -1) {
				res.sendAPIError('INVALID_ARGUMENT', ['pronouns']);
				return;
			}
		}
	}
	/** END INPUT VAIDATION */

	req.user.initialSetup(fullNameLatin, fullNameNative, fullNameLatinSort, nickname, petName, pronouns);

	res.sendAPIResponse();
}

export default user_initial_setup;
