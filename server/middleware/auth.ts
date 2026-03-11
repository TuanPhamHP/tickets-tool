import { getUserFromEvent } from '../utils/auth';

/**
 * Global server middleware that attaches user context to the event.
 * Protected routes should call requireAuth() from utils/auth.ts.
 * This middleware only populates context — it doesn't enforce auth globally.
 */
export default defineEventHandler(async (event) => {
	const user = await getUserFromEvent(event);
	if (user) {
		event.context.user = user;
	}
});
