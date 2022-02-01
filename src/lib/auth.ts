import type { Auth, User } from 'firebase/auth';
import { writable } from 'svelte/store';
import { logEvent } from './firebase';

export const currentUser = writable<{ ready: boolean; user: User | null }>({
	ready: false,
	user: null
});

let watcher = null;
async function watchAuth() {
	if (watcher) return;
	const { app } = await import('./fireboot');
	const { getAuth, onAuthStateChanged } = await import('firebase/auth');
	watcher = onAuthStateChanged(getAuth(app), (user) => {
		currentUser.set({ ready: true, user });
	});
}

export async function signInWithGoogle() {
	const { app } = await import('./fireboot');
	const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
	const auth = getAuth(app);
	const cred = await signInWithPopup(auth, new GoogleAuthProvider());
	logEvent('signed_in');
	currentUser.set({ ready: true, user: cred.user });
}

export async function signOut() {
	const { app } = await import('./fireboot');
	const { getAuth, signOut } = await import('firebase/auth');
	const auth = getAuth(app);
	await signOut(auth);
	logEvent('signed_out');
	currentUser.set({ ready: true, user: null });
}

watchAuth();
