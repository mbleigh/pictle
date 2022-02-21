import { describe, it, assert } from 'vitest';

import { letterState } from '../../src/lib/check';

describe('letterState', () => {
	for (const [word, guess, pos, want] of [
		['other', 'ot', 1, 2],
		['other', 'other', 4, 2],
		['cynic', 'pi', 1, 1],
		['other', 'oo', 1, 0],
		['cools', 'oo', 0, 1],
		['cools', 'coool', 3, 0],
		['cools', 'conol', 3, 1]
	]) {
		it(`returns status ${want} for letter '${guess[pos]}' in position ${pos} of word ${word}`, () => {
			assert.equal(letterState(word as string, guess as string, pos as number), want);
		});
	}
});
