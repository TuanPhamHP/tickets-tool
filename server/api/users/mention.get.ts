import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	await requireAuth(event);

	const db = useDB();
	const items = await db
		.select({ id: users.id, name: users.name, avatar: users.avatar })
		.from(users)
		.where(eq(users.isActive, true));

	return apiSuccess(items);
});
