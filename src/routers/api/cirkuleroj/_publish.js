import * as CRMail from '../../../mail';
import * as CRCirkulero from '../../../api/cirkulero';
import Group from '../../../api/group';
import { removeUnsafeChars, removeUnsafeCharsOneLine } from '../../../util';

async function publish (req, res, next) {
	/**
	 * POST /publish
	 * Publishes a cirkulero
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id    (number)      The id of the cirkulero
	 *   publish_message (string|null) The message used to announce the compiled cirkulero. If null no announcement is made.
	 *                                 Max length: 5000 chars
	 *   publish_email   (string|null) The email to send the announcement to. If null no announcement is made.
	 *                                 Max length: 500 chars
	 *   contribs (Object[]) The modified cirkulero contributions
	 *     user_id           (number)
	 *     group_id          (number)
	 *     faris             (string[])    Max length: 2000 chars
	 *     faras             (string[])    Max length: 2000 chars
	 *     faros             (string[])    Max length: 2000 chars
	 *     comment           (string|null) Max length: 1000 chars
	 *     user_role_comment (string|null) Max length: 1000 chars
	 *
	 * Throws:
	 * INVALID_ARGUMENT  [argument]
	 * INVALID_CIRKULERO            The cirkulero either doesn't exist, is still open for contributions, or is already published
	 * INVALID_CONTRIB   [index]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id',
		'publish_message',
		'publish_email',
		'contribs'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	if (req.body.publish_message !== null && typeof req.body.publish_message !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['publish_message']);
		return;
	}
	let publishMessage = null;
	if (req.body.publish_message) {
		publishMessage = removeUnsafeChars(req.body.publish_message);
		if (publishMessage.length > 5000) {
			res.sendAPIError('INVALID_ARGUMENT', ['publish_message']);
			return;
		}
	}

	if (req.body.publish_email !== null && typeof req.body.publish_email !== 'string') {
		res.sendAPIError('INVALID_ARGUMENT', ['publish_email']);
		return;
	}
	let publishEmail = null;
	if (req.body.publish_email) {
		publishEmail = removeUnsafeCharsOneLine(req.body.publish_email);
		if (publishEmail.length > 500) {
			res.sendAPIError('INVALID_ARGUMENT', ['publish_email']);
			return;
		}
	}

	let stmt = CR.db.cirkuleroj.prepare('select open, published from cirkuleroj where id = ?');
	const cirk = stmt.get(req.body.cirkulero_id);

	if (!cirk || cirk.open || cirk.published) {
		res.sendAPIError('INVALID_CIRKULERO');
		return;
	}

	if (!(req.body.contribs instanceof Array)) {
		res.sendAPIError('INVALID_ARGUMENT', ['contribs']);
		return;
	}

	// Update contribs
	const data = [];
	for (let i in req.body.contribs) {
		const contrib = req.body.contribs[i];

		if (!(
			typeof contrib === 'object' &&

			'user_id' in contrib &&
			'group_id' in contrib &&
			'faris' in contrib &&
			'faras' in contrib &&
			'faros' in contrib &&
			'comment' in contrib &&
			'user_role_comment' in contrib &&

			Number.isSafeInteger(contrib.user_id) &&
			Number.isSafeInteger(contrib.group_id) &&
			contrib.faris instanceof Array &&
			contrib.faras instanceof Array &&
			contrib.faros instanceof Array &&

			(
				contrib.comment === null || (
					typeof contrib.comment === 'string' &&
					contrib.comment.length <= 1000
				)
			) &&
			(
				contrib.user_role_comment === null || (
					typeof contrib.user_role_comment === 'string' &&
					contrib.user_role_comment.length <= 1000
				)
			)
		)) {
			res.sendAPIError('INVALID_CONTRIB', [i]);
			return;
		}

		for (let arr of [ contrib.faris, contrib.faras, contrib.faros ]) {
			for (let n in arr) {
				arr[n] = removeUnsafeCharsOneLine(arr[n]);
				if (typeof arr[n] !== 'string' || arr[n].length > 2000) {
					res.sendAPIError('INVALID_CONTRIB', [i]);
					return;
				}
			}
		}

		let comment = null;
		if (contrib.comment) {
			comment = removeUnsafeChars(contrib.comment);
		}

		let userRoleComment = null;
		if (contrib.user_role_comment) {
			userRoleComment = removeUnsafeCharsOneLine(contrib.user_role_comment);
		}

		data.push({
			cirkulero_id: req.body.cirkulero_id,
			user_id: contrib.user_id,
			group_id: contrib.group_id,
			faris: JSON.stringify(contrib.faris),
			faras: JSON.stringify(contrib.faras),
			faros: JSON.stringify(contrib.faros),
			comment: comment,
			user_role_comment: userRoleComment
		});
	}

	stmt = CR.db.cirkuleroj.prepare('update cirkuleroj_contributions set modified_by_admin = 1, faris = @faris, faras = @faras, faros = @faros, comment = @comment, user_role_comment = @user_role_comment where cirkulero_id = @cirkulero_id and user_id = @user_id and group_id = @group_id');
	CR.db.cirkuleroj.transaction(rows => {
		for (let row of rows) stmt.run(row);
	})(data);

	// Add the published info
	const allowedContributorsUsers = await CRCirkulero.getAllowedContributors();
	const allowedContributors = [];
	for (let user of allowedContributorsUsers) {
		allowedContributors.push({
			user: user.id,
			groups: (await CRCirkulero.getUserCirkuleroContributionGroups(user)).map(group => {
				return {
					id: group.group.id,
					name: group.user.name
				};
			})
		});
	}

	const cirkuleroGroupsRaw = await CRCirkulero.getGroups(false);
	const cirkuleroGroups = {};
	for (let purpose in cirkuleroGroupsRaw) {
		const purposeGroups = cirkuleroGroupsRaw[purpose];
		cirkuleroGroups[purpose] = purposeGroups.map(x => x.id).join(',');
	}

	stmt = CR.db.cirkuleroj.prepare('insert into cirkuleroj_published (cirkulero_id, allowed_contributors, groups_contribute, groups_appear, groups_statistics) values (@cirkulero_id, @allowed_contributors, @groups_contribute, @groups_appear, @groups_statistics)');
	stmt.run({
		cirkulero_id: req.body.cirkulero_id,
		allowed_contributors: JSON.stringify(allowedContributors),
		groups_contribute: cirkuleroGroups.contribute,
		groups_appear: cirkuleroGroups.appear,
		groups_statistics: cirkuleroGroups.statistics
	});

	// Update the cirkulero
	stmt = CR.db.cirkuleroj.prepare('update cirkuleroj set published = 1 where id = ?');
	stmt.run(req.body.cirkulero_id);

	// Delete the old reminders
	stmt = CR.db.cirkuleroj.prepare('delete from cirkulero_deadline_sent where cirkulero_id = ?');
	stmt.run(req.body.cirkulero_id);

	stmt = CR.db.cirkuleroj.prepare('delete from reminders_direct_sent where cirkulero_id = ?');
	stmt.run(req.body.cirkulero_id);

	stmt = CR.db.cirkuleroj.prepare('delete from reminders_lists_sent where cirkulero_id = ?');
	stmt.run(req.body.cirkulero_id);

	// Send out the announcement if necessary
	if (publishEmail && publishMessage) {
		// Obtain the responsible users
		stmt = CR.db.cirkuleroj.prepare('select value from settings where key = "responsible_group"');
		const responsibleGroup = await Group.getGroupById(parseInt(stmt.get().value, 10));
		const users = await responsibleGroup.getAllUsers();

		await CRMail.sendMail({
			subject: `Cirkulero ${req.body.cirkulero_id} pretas!`,
			to: publishEmail,
			cc: users.map(x => x.email),
			text: publishMessage
		});
	}

	res.sendAPIResponse();
}

export default publish;
