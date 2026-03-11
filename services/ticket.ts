import type { apiResponde } from '~/models';

const COOKIE_NAME = 'auth-token';

const base = (_baseUrl: string) => {
	const authCookie = useCookie(COOKIE_NAME);
	const getHeaders = () => ({
		Authorization: authCookie.value ? `Bearer ${authCookie.value}` : '',
	});

	return {
		getList(params?: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/tickets', {
				method: 'GET',
				query: { ...params },
				headers: getHeaders(),
			});
		},
		getOne(id: number): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}`, {
				method: 'GET',
				headers: getHeaders(),
			});
		},
		create(data: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/tickets', {
				method: 'POST',
				body: data,
				headers: getHeaders(),
			});
		},
		update(id: number, data: Record<string, any>): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}`, {
				method: 'PUT',
				body: data,
				headers: getHeaders(),
			});
		},
		remove(id: number): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}`, {
				method: 'DELETE',
				headers: getHeaders(),
			});
		},
		submit(id: number, note?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/submit`, {
				method: 'POST',
				body: { note },
				headers: getHeaders(),
			});
		},
		approve(id: number, note?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/approve`, {
				method: 'POST',
				body: { note },
				headers: getHeaders(),
			});
		},
		reject(id: number, reason: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/reject`, {
				method: 'POST',
				body: { reason },
				headers: getHeaders(),
			});
		},
		estimate(id: number, estimateHours: number, estimateNote?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/estimate`, {
				method: 'POST',
				body: { estimateHours, estimateNote },
				headers: getHeaders(),
			});
		},
		start(id: number, note?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/start`, {
				method: 'POST',
				body: { note },
				headers: getHeaders(),
			});
		},
		complete(id: number, note?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/complete`, {
				method: 'POST',
				body: { note },
				headers: getHeaders(),
			});
		},
		accept(id: number, note?: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/accept`, {
				method: 'POST',
				body: { note },
				headers: getHeaders(),
			});
		},
		cancel(id: number, reason: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/cancel`, {
				method: 'POST',
				body: { reason },
				headers: getHeaders(),
			});
		},
		getComments(id: number): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/comments`, {
				method: 'GET',
				headers: getHeaders(),
			});
		},
		addComment(id: number, content: string): Promise<apiResponde> {
			return $fetch(`/api/tickets/${id}/comments`, {
				method: 'POST',
				body: { content },
				headers: getHeaders(),
			});
		},
	};
};

export default base;
