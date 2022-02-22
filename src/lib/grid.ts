import { letterState } from './check';

export interface State {
	char: string;
	state: number;
	wip?: boolean;
	done?: boolean;
	desired: number;
	valid?: string;
	revising?: boolean;
}

export function generateGrid({
	guesses,
	word,
	pic,
	wip,
	reviseRow
}: {
	guesses: string[];
	word: string;
	pic: number[][];
	wip: string;
	reviseRow?: number;
}): State[][] {
	let grid = [[], [], [], [], [], []];

	for (let y = 0; y < 6; y++) {
		for (let x = 0; x < 5; x++) {
			let cell: State = {
				char: ' ',
				state: 0,
				done: false,
				wip: false,
				revising: false,
				desired: pic[y][x]
			};
			if (cell.desired === 2) {
				cell.valid = word[x];
			} else if (cell.desired === 1) {
				cell.valid = word
					.split('')
					.filter((c) => c !== word[x])
					.join('');
			}

			if (y === 5) {
				cell = { ...cell, char: word[x], state: 2, done: true };
			} else if ((reviseRow === null && y === guesses.length) || y === reviseRow) {
				const char = wip[x] || ' ';
				const state = letterState(word, wip, x);
				cell = { ...cell, char, state, wip: true, revising: y < guesses.length && y === reviseRow };
			} else if (guesses[y]) {
				const char = guesses[y][x];
				const state = letterState(word, guesses[y], x);
				cell = { ...cell, char, state, done: true };
			}
			grid[y][x] = cell;
		}
	}
	return grid;
}

export function stateClasses({ state, done, wip, char, desired }: State): string {
	const desiredBorder = ['border-gray-500', 'border-amber-500', 'border-green-700'][desired];

	if (state === 0 && !wip && !done) {
		return 'border-gray-700';
	} else if (state === 0 && wip && char === ' ') {
		return desiredBorder;
	} else if (state === 0 && wip) {
		return `${desiredBorder} bg-gray-700`;
	} else if (state === 0 && done) {
		return 'border-gray-500';
	} else if (state === 1 && wip) {
		return `text-yellow-500 bg-gray-700 ${desiredBorder}`;
	} else if (state === 1 && done) {
		return 'bg-yellow-500 border-amber-700';
	} else if (state === 2 && wip) {
		return `text-green-300 bg-gray-700 ${desiredBorder}`;
	} else if (state === 2 && done) {
		return 'bg-green-500 border-green-800';
	}
}
