import { useAuthStore } from '~/store/auth';
export const useAuthHeader = (): string => {
	// return auth header with jwt if user is logged in and request is to the api url
	const { user } = useAuthStore();
	const isLoggedIn = !!user?.token;
	return isLoggedIn ? `Bearer ${user.token}` : '';
};
