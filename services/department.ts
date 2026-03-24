import type { apiResponde } from '~/models';

const COOKIE_NAME = 'auth-token';

const base = (_baseUrl: string) => {
	const authCookie = useCookie(COOKIE_NAME);
	const getHeaders = () => ({
		Authorization: authCookie.value ? `Bearer ${authCookie.value}` : '',
	});

	return {
		getById(id: number): Promise<apiResponde> {
			return $fetch(`/api/departments/${id}`, {
				method: 'GET',
				headers: getHeaders(),
			});
		},
		getList(params?: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/departments', {
				method: 'GET',
				query: { ...params },
				headers: getHeaders(),
			});
		},
		create(data: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/departments', {
				method: 'POST',
				body: data,
				headers: getHeaders(),
			});
		},
		update(id: number, data: Record<string, any>): Promise<apiResponde> {
			return $fetch(`/api/departments/${id}`, {
				method: 'PUT',
				body: data,
				headers: getHeaders(),
			});
		},
	};
};

export default base;
