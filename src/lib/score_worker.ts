import { highLetterScore } from './check';

onmessage = function (e) {
	const score = highLetterScore(e.data[0], e.data[1]);
	this.postMessage(score);
};
