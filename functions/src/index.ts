import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as PImage from 'pureimage';

admin.initializeApp();

const COLORS = {
	bg: 'rgb(31,41,55)',
	dark: 'rgba(0,0,0,0.5)',
	yellow: 'rgb(234,179,8)',
	green: 'rgb(34,197,94)'
};

export const renderPuzzle = functions.https.onRequest(async (req, res) => {
	const parts = req.path.split('/');
	const puzzle = parts[parts.length - 1].split('.')[0];
	const ref = admin.database().ref(`puzzles/${puzzle}`);
	const snap = await ref.get();

	if (snap.child('image').exists()) {
		res.redirect(snap.child('image').val(), 302);
	}

	const img = PImage.make(512, 512, {});

	const ctx = img.getContext('2d');

	ctx.fillStyle = COLORS.bg;
	ctx.fillRect(0, 0, 512, 512);

	const pic = snap
		.child('pic')
		.val()
		.split(' ')
		.map((l: string) =>
			l
				.split('')
				.map(
					(c: string) =>
						({ 0: COLORS.dark, 1: COLORS.yellow, 2: COLORS.green }[c as '0' | '1' | '2'])
				)
		);

	for (let i = 0; i < pic.length; i++) {
		for (let j = 0; j < pic[i].length; j++) {
			ctx.fillStyle = pic[i][j];
			ctx.fillRect(68 + j * 75, 35 + i * 75, 65, 65);
		}
	}

	const file = admin.storage().bucket().file(`puzzles/${puzzle}.png`);
	const storeStream = file.createWriteStream({ contentType: 'image/png', public: true });
	PImage.encodePNGToStream(img, storeStream).then(async () => {
		const imageUrl = `https://pictle.appspot.com.storage.googleapis.com/puzzles/${puzzle}.png`;
		await ref.update({ image: imageUrl });
		res.redirect(imageUrl, 302);
	});
});
