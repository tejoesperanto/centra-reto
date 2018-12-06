import { removeUnsafeChars, removeUnsafeCharsOneLine } from '../../../util';
import * as cirkulero from '../../../api/cirkulero';

async function contribute (req, res, next) {
	/**
	 * POST /contribute
	 * Inserts a new cirkulero contribution or updates an existing
	 *
	 * Login required
	 * Initial setup required
	 *
	 * User must partain to group permitted to contribute to cirkuleroj (see api/cirkulero/mayUserContributeToCirkuleroj)
	 *
	 * Parameters:
	 *   cirkulero_id        (number)   The id of the cirkulero to contribute to
	 *   group_id            (number)   The id of the group the user is contributing on behalf of
	 *   [user_role_comment] (string)   An optional comment on the user's role
	 *   faris               (string[]) What the user did during the month
	 *   faras               (string[]) What the user is currently doing
	 *   faros               (string[]) What the user will be doing
	 *   [comment]           (string)   A comment on the user's contribution
	 *
	 * Throws:
	 * INVALID_ARGUMENT   [argument]
	 * MAY_NOT_CONTRIBUTE            The user may not contribute to cirkuleroj
	 * INVALID_CIRKULERO             The cirkulero with the provided id either doesn't exist or isn't open to contributions
	 */

	if (!await cirkulero.mayUserContributeToCirkuleroj(req.user)) {
		res.sendAPIError('MAY_NOT_CONTRIBUTE');
		return;
	}
	
	// Begin data validation
	const fields = [
		'cirkulero_id',
		'group_id',
		'faris',
		'faras',
		'faros'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (!Number.isSafeInteger(req.body.group_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['group_id']);
		return;
	}

	let userRoleComment = null;
	if ('user_role_comment' in req.body) {
		if (typeof req.body.user_role_comment !== 'string') {
			res.sendAPIError('INVALID_ARGUMENT', ['user_role_comment']);
			return;
		}
		userRoleComment = removeUnsafeCharsOneLine(req.body.user_role_comment);
	}

	if (!(req.body.faris instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['faris']);
		return;
	}
	const faris = [];
	for (let faro of req.body.faris) {
		if (typeof faro !== 'string') {
			res.sendAPIError('INVALID_ARGUMENT', ['faris']);
			return;
		}
		faris.push(removeUnsafeCharsOneLine(faro));
	}

	if (!(req.body.faras instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['faras']);
		return;
	}
	const faras = [];
	for (let faro of req.body.faras) {
		if (typeof faro !== 'string') {
			res.sendAPIError('INVALID_ARGUMENT', ['faras']);
			return;
		}
		faras.push(removeUnsafeCharsOneLine(faro));
	}

	if (!(req.body.faros instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['faros']);
		return;
	}
	const faros = [];
	for (let faro of req.body.faros) {
		if (typeof faro !== 'string') {
			res.sendAPIError('INVALID_ARGUMENT', ['faros']);
			return;
		}
		faros.push(removeUnsafeCharsOneLine(faro));
	}

	let comment = null;
	if ('comment' in req.body) {
		if (typeof req.body.comment !== 'string') {
			res.sendAPIError('INVALID_ARGUMENT', ['comment']);
			return;
		}
		comment = removeUnsafeChars(req.body.comment);
	}
	// End data validation

	// Ensure that the cirkulero exists
	let stmt = CR.db.cirkuleroj.prepare('select open from cirkuleroj where id = ?');
	const row = stmt.get(req.body.cirkulero_id);

	if (!row || !row.open) {
		res.sendAPIError('INVALID_CIRKULERO');
		return;
	}

	// Ensure that the user is in the group
	const groups = await cirkulero.getUserCirkuleroContributionGroups(req.user);
	const groupIds = groups.map(x => x.group.id);
	const groupIndex = groupIds.indexOf(req.body.group_id);
	if (groupIndex === -1) {
		res.sendAPIError('INVALID_ARGUMENT', ['group_id']);
		return;
	}
	const group = groups[groupIndex];

	// Submit the contribution
	stmt = CR.db.cirkuleroj.prepare('insert or replace into cirkuleroj_contributions (cirkulero_id, user_id, group_id, user_role, user_role_comment, faris, faras, faros, comment) values (@cirkulero_id, @user_id, @group_id, @user_role, @user_role_comment, @faris, @faras, @faros, @comment)');
	stmt.run({
		cirkulero_id: req.body.cirkulero_id,
		user_id: req.user.id,
		group_id: req.body.group_id,
		user_role: group.user.name,
		user_role_comment: userRoleComment,
		faris: JSON.stringify(faris),
		faras: JSON.stringify(faras),
		faros: JSON.stringify(faros),
		comment: comment
	});

	res.sendAPIResponse();
}

export default contribute;
