export async function logEvent(name: string, params?: Record<string, any>) {
	const { app } = await import('./fireboot');
	const { getAnalytics, logEvent } = await import('firebase/analytics');
	return logEvent(getAnalytics(app), name, params);
}

import('./fireboot');
