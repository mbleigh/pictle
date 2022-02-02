const PUZZLE_200_START = 1642003200000; // 2022-01-22T16:00:00Z (8am PT)
const ONE_DAY_MS = 86400000;

export function puzzleForTime(time?: number): number {
	time = time || Date.now();
	return 200 + Math.floor((Date.now() - PUZZLE_200_START) / ONE_DAY_MS);
}

export function timeForPuzzle(num: number): number {
	return PUZZLE_200_START + (num - 200) * ONE_DAY_MS;
}
