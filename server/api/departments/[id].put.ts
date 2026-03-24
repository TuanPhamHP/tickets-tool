import { eq } from 'drizzle-orm';
import { departments } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	const db = useDB();
	const [dept] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
	if (!dept) throw createError({ statusCode: 404, statusMessage: 'Bộ phận không tồn tại' });

	await db
		.update(departments)
		.set({
			name: body.name ?? dept.name,
			company: body.company ?? dept.company,
			description: body.description !== undefined ? body.description : dept.description,
			updatedAt: new Date(),
		})
		.where(eq(departments.id, id));
	const [updated] = await db.select().from(departments).where(eq(departments.id, id));

	return apiSuccess(updated, 'Cập nhật bộ phận thành công');
});
