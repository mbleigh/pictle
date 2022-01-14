import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as fLogEvent } from 'firebase/analytics';

const app = initializeApp({
	apiKey: 'AIzaSyCFnoz4_jsO-StDt9vie-SWo0ZSAffUsC8',
	authDomain: 'pictle.firebaseapp.com',
	projectId: 'pictle',
	storageBucket: 'pictle.appspot.com',
	messagingSenderId: '183261919274',
	appId: '1:183261919274:web:1c5e3c4ea6c6226eaeeb53',
	measurementId: 'G-ZEPK6EFR57'
});

const analytics = getAnalytics(app);

export function logEvent(name: string, params?: Record<string, any>) {
	return fLogEvent(analytics, name, params);
}
