import { solvable, guessable } from '$lib/words';

export function check(word: string, guess: string, pattern: number[]): string | null {
	if (!solvable.includes(guess) && !guessable.includes(guess)) {
		return 'Word not in word list.';
	}
	return checkPattern(word, guess, pattern);
}

export function letterState(word: string, guess: string, pos: number): number {
	const letterAtPos = guess[pos];
	if (!word.includes(letterAtPos)) {
		return 0;
	} else if (word[pos] === letterAtPos) {
		return 2;
	}

	let available = 0;
	for (let i = 0; i < 5; i++) {
		if (word[i] === letterAtPos && guess[i] !== letterAtPos) ++available;
	}
	for (let i = 0; i < pos; i++) {
		if (word[i] !== guess[i] && guess[i] === letterAtPos) --available;
	}
	return available > 0 ? 1 : 0;
}

function checkPattern(word: string, guess: string, pattern: number[]): string | null {
	for (let i = 0; i < 5; i++) {
		const want = pattern[i];
		if (want !== letterState(word, guess, i)) {
			return 'Word does not match pattern.';
		}
	}
}

export function checkAll(
	word: string,
	pattern: number[],
	set: 'all' | 'guessable' | 'solvable' = 'solvable'
): string[] {
	const out = [];
	const list =
		set === 'all' ? [...solvable, ...guessable] : set === 'guessable' ? guessable : solvable;
	for (const guess of list) {
		if (!checkPattern(word, guess, pattern)) {
			out.push(guess);
		}
	}
	return out;
}

const unique = (w, ind, a) => a.indexOf(w) === ind;
export function highLetterScore(word: string, pic: number[][]): number {
	if (!pic || !word) return 0;
	if (pic.length === 6) {
		pic = pic.slice(0, 5);
	}

	const choiceGrid = pic.map((row) => checkAll(word, row, 'solvable'));

	let maxScore = 0;
	let iter = 0;
	let totalIter = choiceGrid.reduce((acc, c) => acc * c.length, 1);
	for (let i = 0; i < choiceGrid[0].length; i++) {
		for (let j = 0; j < choiceGrid[1].length; j++) {
			for (let k = 0; k < choiceGrid[2].length; k++) {
				for (let l = 0; l < choiceGrid[3].length; l++) {
					for (let m = 0; m < choiceGrid[4].length; m++) {
						const solve = [
							choiceGrid[0][i],
							choiceGrid[1][j],
							choiceGrid[2][k],
							choiceGrid[3][l],
							choiceGrid[4][m]
						];
						if (solve.filter(unique).length === solve.length) {
							const uniqueCount = solve.join('').split('').filter(unique).length;
							if (uniqueCount > maxScore) {
								maxScore = uniqueCount;
							}
						}
						iter++;
						if (iter % 1000000 == 0) {
							console.log(word, 'iteration', iter, `(${(100 * iter) / totalIter}%)`);
						}
					}
				}
			}
		}
	}
	return maxScore;
}
