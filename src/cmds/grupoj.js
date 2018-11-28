import Table from 'tty-table';

import * as CRCmd from '../cmd';
import Group from '../api/group';

export const helpBrief = 'Listigas ĉiujn grupojn.';
export const helpDetailed = helpBrief;

export async function cmd (bits, log) {
	if (bits.length > 0) {
		log('SYNTAX');
		return;
	}

	const groups = Group.getAllGroups();

	// Display them in a nice table
	const header = [
		{ value: '#' },
		{ value: 'baza nomo' },
		{ value: 'montra nomo' },
		{ value: 'membroenhavpova' },
		{ value: 'gepatra grupo' },
		{ value: 'publika' },
		{ value: 'serĉebla' },
		{ value: 'argumentoj' },
	];
	const rows = [];

	for (let group of groups.values()) {
		rows.push([
			group.id,
			group.nameBase,
			group.nameDisplay || '',
			group.membersAllowed ? 'Jes' : 'Ne',
			group.parent || '-',
			group.public ? 'Jes' : 'Ne',
			group.searchable ? 'Jes' : 'Ne',
			group.args || ''
		]);
	}

	const table = Table(header, rows).render();

	log('info', '\n%s', table);
}
