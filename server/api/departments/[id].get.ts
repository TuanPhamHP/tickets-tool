import { eq } from 'drizzle-orm';
import { departments, users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));

	const db = useDB();

	// requester / implementer chỉ được xem phòng ban của mình
	if (auth.role !== 'admin' && auth.role !== 'approver') {
		const [dbUser] = await db
			.select({ departmentId: users.departmentId })
			.from(users)
			.where(eq(users.id, Number(auth.sub)))
			.limit(1);

		if (!dbUser?.departmentId || dbUser.departmentId !== id) {
			throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền xem phòng ban này' });
		}
	}

	const [dept] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
	if (!dept) throw createError({ statusCode: 404, statusMessage: 'Phòng ban không tồn tại' });

	const deptUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			phone: users.phone,
			avatar: users.avatar,
			isActive: users.isActive,
			company: users.company,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.departmentId, id));

	return apiSuccess({ ...dept, users: deptUsers });
});
