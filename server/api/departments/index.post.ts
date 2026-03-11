import { eq } from 'drizzle-orm';
import { departments } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin');

	const body = await readBody(event);
	if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'Tên bộ phận là bắt buộc' });

	const db = useDB();
	const deptInsert = await db.insert(departments).values({
		name: body.name,
		company: body.company ?? 'Xuân Cương',
	});
	const [dept] = await db.select().from(departments).where(eq(departments.id, deptInsert[0].insertId));

	return apiSuccess(dept, 'Tạo bộ phận thành công');
});
