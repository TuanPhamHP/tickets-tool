import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);

	const db = useDB();
	const [user] = await db.select().from(users).where(eq(users.id, Number(auth.sub))).limit(1);

	if (!user) {
		throw createError({ statusCode: 404, statusMessage: 'Người dùng không tồn tại' });
	}

	const { passwordHash: _, ...safeUser } = user;
	return apiSuccess(safeUser);
});
