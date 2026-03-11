import type { apiResponde } from '~/models';

const COOKIE_NAME = 'auth-token';

const base = (_baseUrl: string) => {
	const authCookie = useCookie(COOKIE_NAME);
	const getHeaders = () => ({
		Authorization: authCookie.value ? `Bearer ${authCookie.value}` : '',
	});

	return {
		getUsers(params?: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/users', {
				method: 'GET',
				query: { ...params },
				headers: getHeaders(),
			});
		},
		createUser(data: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/users', {
				method: 'POST',
				body: data,
				headers: getHeaders(),
			});
		},
		updateUser(id: number, data: Record<string, any>): Promise<apiResponde> {
			return $fetch(`/api/users/${id}`, {
				method: 'PUT',
				body: data,
				headers: getHeaders(),
			});
		},
	};
};

export default base;
