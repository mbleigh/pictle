import { solvable, guessable } from '$lib/words';

export function check(word: string, guess: string, pattern: number[]): string | null {
	if (!solvable.includes(guess) && !guessable.includes(guess)) {
		return 'Word not in word list.';
	}
	return checkPattern(word, guess, pattern);
}

function checkPattern(word: string, guess: string, pattern: number[]): string | null {
	for (let i = 0; i < 5; i++) {
		const want = pattern[i];
		if (
			(want === 0 && word.includes(guess[i])) ||
			(want === 1 && !word.includes(guess[i])) ||
			(want === 1 && word[i] === guess[i]) ||
			(want === 2 && word[i] !== guess[i])
		) {
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
