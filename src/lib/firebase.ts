export async function logEvent(name: string, params?: Record<string, any>) {
	const { logEvent: fLogEvent } = await import('./fireboot');
	return fLogEvent(name, params);
}
