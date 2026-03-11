import { eq, and } from 'drizzle-orm';
import { notifications } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const userId = Number(auth.sub);

	const db = useDB();
	await db
		.update(notifications)
		.set({ isRead: true })
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

	return apiSuccess(null, 'Đã đánh dấu tất cả là đã đọc');
});
