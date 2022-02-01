import { currentUser } from './auth';
import { get } from 'svelte/store';

const dbOrigin = 'https://pictle-default-rtdb.firebaseio.com';

export async function dbGet<T = any>(
	path: string,
	query: Record<string, string>
): Promise<T | null> {
	const token = await get(currentUser)?.user?.getIdToken();
	const params = new URLSearchParams({ ...query });
	if (token) {
		params.set('auth', token);
	}

	const response = await fetch(
		`${dbOrigin}/${path}.json${params.toString().length ? `?${params.toString()}` : ''}`
	);
	if (response.status === 200) {
		return (await response.json()) as T;
	}
	return null;
}

export async function dbSet(path: string, value: any): Promise<void> {
	const token = await get(currentUser).user?.getIdToken();
	const response = await fetch(`${dbOrigin}/${path}.json${token ? `?auth=${token}` : ''}`, {
		method: 'PUT',
		body: JSON.stringify(value),
		headers: {
			'Content-Type': 'json'
		}
	});
}
