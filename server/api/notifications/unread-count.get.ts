import { eq, and, count } from 'drizzle-orm';
import { notifications } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const db = useDB();
	const [result] = await db
		.select({ count: count() })
		.from(notifications)
		.where(and(eq(notifications.userId, Number(auth.sub)), eq(notifications.isRead, false)));

	return apiSuccess({ count: result?.count ?? 0 });
});
