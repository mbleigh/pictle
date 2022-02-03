export async function logEvent(name: string, params?: Record<string, any>) {
	const { getAnalytics, logEvent } = await import('firebase/analytics');
	return logEvent(getAnalytics(), name, params);
}

export async function getMessagingToken(): Promise<string> {
	const { getMessaging, getToken } = await import('firebase/messaging');
	return await getToken(getMessaging(), {
		serviceWorkerRegistration: await navigator.serviceWorker?.getRegistration(),
		vapidKey:
			'BFbfzAG9t0pMrcrFEICYnHeY356cwbmlCmixAqki3g9r-R0NOOdfKfRd1p-Q9JJypz86_ZqjRJZstSqVZWEwrDA'
	});
}

import('./fireboot');
