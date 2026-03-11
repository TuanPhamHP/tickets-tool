import { useAuthStore } from '~/store/auth';
import { useAppStateStore } from '~/store/appState';

export default defineNuxtRouteMiddleware(async to => {
	const authStore = useAuthStore();
	const appStateStore = useAppStateStore();
	const authCookie = useCookie('auth-token');

	if (!authStore.isLogged) {
		console.log(to);
		if (to.name !== 'login') {
			if (authCookie.value) {
				authStore.getUserInfo();
				return;
			}
			return navigateTo(`/login?rTo=${JSON.stringify(to.fullPath)}`);
		}
		appStateStore.setFetchingPermisson(0);
	} else {
		appStateStore.setFetchingPermisson(2);
		if (to.name === 'login') {
			return navigateTo('/');
		}
	}
});
