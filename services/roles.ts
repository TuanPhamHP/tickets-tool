import { useAuthHeader } from '~~/composables/api';
import { apiResponde } from '~~/models';

const base = (API_BASE_URL: String) => {
	const authCookie = useCookie('auth-token');
	return {
		getListData(payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		getListPermission(payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/permissions`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		getDetailData(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		create(payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},

		update(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}`, {
				method: 'PUT',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		addUsers(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}/add-users`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		removeUser(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}/remove-user`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},

		syncPermission(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}/sync-permissions`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},

		cancel(id: number | string, payload?: Record<string, any>): Promise<apiResponde> {
			return $fetch(`${API_BASE_URL}/api/admin/user-management/roles/${id}/cancel`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
	};
};
export default base;
