import type { apiResponde } from '~/models';

const COOKIE_NAME = 'auth-token';

const base = (_API_BASE_URL: String) => {
	return {
		login(payload?: Record<string, any>): Promise<apiResponde> {
			// Gọi local Nitro API – field "login" map sang "email"
			const body = payload
				? { email: payload.login ?? payload.email, password: payload.password }
				: payload;
			return $fetch('/api/auth/login', {
				method: 'POST',
				body,
			});
		},
		getUserInfo(_token?: string | null, payload?: Object): Promise<apiResponde> {
			const authCookie = useCookie(COOKIE_NAME);
			const token = _token || authCookie.value;
			return $fetch('/api/auth/me', {
				method: 'GET',
				params: { ...payload },
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
		},
		getUserPermission(_payload?: Object): Promise<apiResponde> {
			// Permissions được trả về trong getUserInfo, không cần endpoint riêng
			return Promise.resolve({ success: true, data: { permissions: [] } } as any);
		},
		changePassword(payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie(COOKIE_NAME);
			return $fetch('/api/auth/change-password', {
				method: 'POST',
				body: payload,
				headers: authCookie.value ? { Authorization: `Bearer ${authCookie.value}` } : {},
			});
		},
		getMentionList(): Promise<apiResponde> {
			const authCookie = useCookie(COOKIE_NAME);
			return $fetch('/api/users/mention', {
				method: 'GET',
				headers: authCookie.value ? { Authorization: `Bearer ${authCookie.value}` } : {},
			});
		},
	};
};
export default base;
