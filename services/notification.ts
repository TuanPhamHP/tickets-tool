import type { apiResponde } from '~/models';

const COOKIE_NAME = 'auth-token';

const base = (_API_BASE_URL: String) => {
	const getHeaders = () => {
		const authCookie = useCookie(COOKIE_NAME);
		return authCookie.value ? { Authorization: `Bearer ${authCookie.value}` } : {};
	};
	return {
		getList(params?: Record<string, any>): Promise<apiResponde> {
			return $fetch('/api/notifications', {
				method: 'GET',
				params,
				headers: getHeaders(),
			});
		},
		getUnreadCount(): Promise<apiResponde> {
			return $fetch('/api/notifications/unread-count', {
				method: 'GET',
				headers: getHeaders(),
			});
		},
		markRead(id: number): Promise<apiResponde> {
			return $fetch(`/api/notifications/${id}/read`, {
				method: 'PATCH',
				headers: getHeaders(),
			});
		},
		markAllRead(): Promise<apiResponde> {
			return $fetch('/api/notifications/read-all', {
				method: 'PATCH',
				headers: getHeaders(),
			});
		},
	};
};
export default base;
