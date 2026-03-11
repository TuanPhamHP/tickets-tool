import user from './user';
import vehicle from './vehicle';
import ticket from './ticket';
import department from './department';
import admin from './admin';
import notification from './notification';

export type ApiService = {
	user: ReturnType<typeof user>;
	vehicle: ReturnType<typeof vehicle>;
	ticket: ReturnType<typeof ticket>;
	department: ReturnType<typeof department>;
	admin: ReturnType<typeof admin>;
	notification: ReturnType<typeof notification>;
};

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const baseUrl = config.public.apiBaseUrl as string;
	const api = {
		user: user(baseUrl),
		vehicle: vehicle(baseUrl),
		ticket: ticket(baseUrl),
		department: department(baseUrl),
		admin: admin(baseUrl),
		notification: notification(baseUrl),
	};
	return {
		provide: {
			api,
		},
	};
});
