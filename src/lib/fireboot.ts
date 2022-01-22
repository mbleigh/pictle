import { initializeApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';

export const app = initializeApp({
	apiKey: 'AIzaSyCFnoz4_jsO-StDt9vie-SWo0ZSAffUsC8',
	authDomain: 'pictle.firebaseapp.com',
	projectId: 'pictle',
	storageBucket: 'pictle.appspot.com',
	messagingSenderId: '183261919274',
	appId: '1:183261919274:web:1c5e3c4ea6c6226eaeeb53',
	measurementId: 'G-ZEPK6EFR57'
});

try {
	getPerformance(app);
} catch (e) {
	console.log('Unable to load Firebase Performance. Probably not in browser.');
}
