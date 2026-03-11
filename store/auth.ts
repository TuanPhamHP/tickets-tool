import { defineStore } from 'pinia';
import type { AuthUser, apiResponde } from '~/models/index';
import type { CookieOptions } from '~/models';
import { useAppStateStore } from './appState';
import { useInternalStore } from './internal';
export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: null as AuthUser | null,
		token: '' as String,
	}),
	getters: {
		isLogged: state => !!state.user && !!state.token,
	},
	actions: {
		setUser(payload: AuthUser) {
			this.user = payload;
		},
		setToken(payload: String) {
			this.token = payload;
		},

		logout() {
			const opt: CookieOptions = {
				maxAge: 1,
				sameSite: 'lax',
			};
			const authCookie = useCookie('auth-token', opt);
			const authFreshCookie = useCookie('auth-token-refresh', opt);
			authCookie.value = '';
			authFreshCookie.value = '';
			this.user = null;
			this.token = '';
		},
		getUserInfo() {
			const { $api } = useNuxtApp();
			const authCookie = useCookie('auth-token');
			const token = authCookie.value || (this.token as string);
			$api.user
				.getUserInfo(token)
				.then(
					res => {
						const rs = res as apiResponde;
						// Local server: { data: { ...userFields } } không wrap thêm .user
						const user: Record<string, any> = rs.data?.user ?? rs.data;
						this.token = `${authCookie.value}`;
						this.user = { ...user, name: user.name, id: user.id, token: `${authCookie.value}` };
						useInternalStore().setAuthPermissions(user.permissions ?? []);
						useAppStateStore().setFetchingPermisson(1);
					},
					_err => {
						useAppStateStore().setFetchingPermisson(2);
						this.logout();
						window.location.href = '/login';
					}
				)
				.catch(_err => {
					useAppStateStore().setFetchingPermisson(2);
					this.logout();
					window.location.href = '/login';
				});
		},
	},
});