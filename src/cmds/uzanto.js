import { promisify } from 'util';
import Table from 'tty-table';
import moment from 'moment-timezone';
import _csvParse from 'csv-parse';
const csvParse = promisify(_csvParse);

import User from '../api/user';
import Group from '../api/group';
import * as CRCmd from '../cmd';
import * as CRMail from '../mail';

export const helpBrief = 'Iloj rilate al uzantoj.';

export const helpDetailed = `
- uzanto aktivigi <retpoŝtadreso> <pasvorto>
  Aktivigas uzanton kaj agordas la indikitan pasvorton.

- uzanto grupoj <retpoŝtadreso>
  Listigas ĉiujn grupojn en kiuj membras la uzanto.

- uzanto grupoj <retpoŝtadreso> aldoni <grupo> [argumentoj] [ekde] [ĝis]
  Aldonas uzanton al la indikita grupo.
  argumentoj estas csv-listo de argumentoj por la grupo. Skribu - por havi neniun valoron.
  ekde estas la tempo ekde kiam la membreco en la grupo validas. Skribu ISO-tempon aŭ la specialan valoron 'nun'.
  ĝis estas la tempo je kiu la membreco en la grupo ĉesas validi. Skribu ISO-tempon aŭ la specialan valoron 'ĉiam'.

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
					rows.push([
						group.group.id,
						group.user.active ? 'jes' : 'ne',
						group.user.direct ? 'jes' : 'ne',
						group.user.name,
						moment.unix(group.user.from).format(CR.timeFormats.dateTimeSimple),
						group.user.to ? moment.unix(group.user.to).format(CR.timeFormats.dateTimeSimple) : '-'
					]);
				}

				const table = Table(header, rows).render();

				log('info', 'La uzanto %s membras en la jenaj grupoj:\n%s', email, table);

			} else if (bits.length >= 3) {
				if (bits[2] === 'aldoni') {
					if (bits.length < 4 || bits.length > 7) {
						log('SYNTAX');
						return;
					}

					const groupId = bits[3];
					const group = await Group.getGroupById(groupId);
					if (!group) {
						log('error', 'Grupo ne trovita.');
						return;
					}

					let argsArr = [];
					if (bits[4] && bits[4] !== '-') {
						argsArr = (await csvParse(bits[4]))[0]; // First line only
					}

					let timeFrom = bits[5];
					if (!timeFrom || timeFrom === 'nun') {
						timeFrom = moment().unix();
					} else {
						timeFrom = moment(timeFrom).unix();
					}

					let timeTo = bits[6];
					if (!timeTo || timeTo === 'ĉiam') {
						timeTo = null;
					} else {
						timeTo = moment(timeTo).unix();
					}

					const wasAdded = await user.addToGroup(group, argsArr, timeFrom, timeTo);
					if (!wasAdded) {
						log('error', 'La indikita grupo ne permesas rektajn membrojn.');
						return;
					}

					log('info', "Aldonis %s al grupo n-ro %s. Uzu la komandon `uzanto grupoj %s` por vidi ĉiujn grupojn de la uzanto.", user.email, user.email, group.id);

				} else {
					log('SYNTAX');
				}

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
