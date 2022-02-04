import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as PImage from 'pureimage';
import { puzzleForTime } from './times';

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
	const file = admin.storage().bucket().file(`puzzles/${puzzle}.png`);

	res.set('Cache-Control', 'immutable, max-age=31536000, s-maxage=31536000');
	res.set('Content-Type', 'image/png');

	if (snap.child('image').exists()) {
		file.createReadStream().pipe(res);
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

	const storeStream = file.createWriteStream({ contentType: 'image/png', public: true });
	PImage.encodePNGToStream(img, storeStream).then(async () => {
		const imageUrl = `https://pictle.appspot.com.storage.googleapis.com/puzzles/${puzzle}.png`;
		await ref.update({ image: imageUrl });
		file.createReadStream().pipe(res);
	});
});

export const manageNotifications = functions.database
	.ref('notifications/{token}')
	.onWrite(async (change, context) => {
		if (change.after.exists()) {
			await admin.messaging().subscribeToTopic(context.params.token, 'new_puzzle');
			functions.logger.info(
				`Subscribed token ${context.params.token.substr(0, 10)} to notifications.`
			);
		} else {
			await admin.messaging().unsubscribeFromTopic(context.params.token, 'new_puzzle');
			functions.logger.info(
				`Unsubscribed token ${context.params.token.substr(0, 10)} from notifications.`
			);
		}
	});

export const sendNotifications = functions.pubsub
	.schedule('0 8 * * *')
	.timeZone('America/Los_Angeles')
	.onRun(async () => {
		const puzzle = puzzleForTime(Date.now() + 3600000);
		const snap = await admin.database().ref(`puzzles/${puzzle}`).get();
		const { word, teaser }: { word: string; teaser?: string } = snap.val();

		await admin.messaging().send({
			topic: 'new_puzzle',

			notification: {
				title: `Pictle #${puzzle}: ${word.toUpperCase()} is live!`,
				body: teaser || `A new puzzle is ready to test your Wordley wits`
			},
			webpush: {
				notification: {
					icon: `https://pictle.web.app/image/${puzzle}.png`,
					tag: 'new_puzzle',
					badge: '/icon_mono_128.png'
				},
				fcmOptions: { link: `/?utm_medium=push&utm_campaign=new_puzzle_${puzzle}` }
			}
		});
		functions.logger.info(`Delivered push for puzzle #${puzzle} (${word.toUpperCase()})`);
	});
