import Table from 'tty-table';
import moment from 'moment-timezone';

import User from '../api/user'
import * as CRCmd from '../cmd';
import * as CRMail from '../mail';

export const helpBrief = 'Iloj rilate al uzantoj.';

export const helpDetailed = `
- uzanto aktivigi <retpoŝtadreso> <pasvorto>
  Aktivigas uzanton kaj agordas la indikitan pasvorton.

- uzanto grupoj <retpoŝtadreso>
  Listigas ĉiujn grupojn en kiuj membras la uzanto.

- uzanto krei <retpoŝtadreso>
  Kreas novan uzanton kun la indikita retpoŝtadreso. Poste estas donita aktivigligilo, kiu povas esti sendita al la uzanto per retpoŝto.

- uzanto permeso <retpoŝtadreso> <permeso>
  Kontrolas ĉu uzanto havas la indikitan permeson.
`.trim();

export async function cmd (bits, log) {
	if (bits.length < 1) {
		log('SYNTAX');
		return;
	}

	const commands = {
		krei: async function () {
			if (bits.length != 2) {
				log('SYNTAX');
				return;
			}

			const email = bits[1];

			// Ensure the email isn't taken
			const isTaken = User.isEmailTaken(email);
			if (isTaken) {
				log('error', 'retpoŝtadreso %s estas jam uzata.', email);
				return;
			}

			// Ensure the user input the correct email
			const emailCorrect = await CRCmd.promptYesNoClose(`Kreos konton por homo kun la retpoŝtadreso ${email}.`);
			if (!emailCorrect) {
				return;
			}

			const user = await User.createUser(email);
			const activationURL = user.getActivationURL();
			log('info', `Kreis konton. Iru al ${activationURL} por aktivigi la konton.`);

			// Offer to send an email with the link
			const sendEmail = await CRCmd.promptYesNoClose(`Ĉu vi volas sendi invitretmesaĝon kun la aktivigligilo?`, false);
			if (!sendEmail) {
				return;
			}

			await CRMail.renderSendMail('new_account', {
				activation_link: activationURL
			}, {
				to: email
			});

			log('info', `Sendis invitretmesaĝon al ${email}.`);
		},
		aktivigi: async function () {
			if (bits.length != 3) {
				log('SYNTAX');
				return;
			}

			const email = bits[1];
			const password = bits[2];

			// Obtain the user
			const user = User.getUserByEmail(email);
			if (!user) {
				log('error', 'Uzanto kun indikita retpoŝtadreso ne trovita.');
				return;
			}

			const hashedPassword = await User.hashPassword(password);
			user.activate(hashedPassword);

			log('info', 'Aktivigis uzanton.');
		},
		grupoj: async function () {
			if (bits.length == 1) {
				log('SYNTAX');
				return;
			}

			const email = bits[1];

			// Obtain the user
			const user = User.getUserByEmail(email);
			if (!user) {
				log('error', 'Uzanto kun indikita retpoŝtadreso ne trovita.');
				return;
			}

			if (bits.length == 2) {
				// Get all the user's groups
				const groups = await user.getGroups();
				
				// Display them in a nice table
				const header = [
					{ value: '#' },
					{ value: 'aktiva' },
					{ value: 'rekta' },
					{ value: 'nomo' },
					{ value: 'ekde' },
					{ value: 'ĝis' }
				];
				const rows = [];

				for (let group of groups.values()) {
					const validity = group.getValidityForUser(user);
					rows.push([
						group.id,
						validity.active ? 'jes' : 'ne',
						group.isDirectForUser(user) ? 'jes' : 'ne',
						await group.getNameForUser(user),
						moment.unix(validity.timeFrom).format(CR.timeFormats.dateTimeSimple),
						validity.timeTo ? moment.unix(validity.timeTo).format(CR.timeFormats.dateTimeSimple) : '-'
					]);
				}

				const table = Table(header, rows).render();

				log('info', 'La uzanto %s membras en la jenaj grupoj:\n%s', email, table);

			} else {
				log('SYNTAX');
			}
		},
		permeso: async function () {
			if (bits.length != 3) {
				log('SYNTAX');
				return;
			}

			const email = bits[1];
			const permission = bits[2];

			// Obtain the user
			const user = User.getUserByEmail(email);
			if (!user) {
				log('error', 'Uzanto kun indikita retpoŝtadreso ne trovita.');
				return;
			}

			const hasPermission = await user.hasPermission(permission);

			if (hasPermission) {
				log('info', 'JES');
			} else {
				log('info', 'NE');
			}
		}
	};

	if (!(bits[0] in commands)) {
		log('error', 'nekonata komando `%s`', bits[0])
		return;
	}

	await commands[bits[0]]();
}
