import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin');

	const body = await readBody(event);

	if (!body?.name || !body?.email || !body?.password || !body?.role) {
		throw createError({ statusCode: 400, statusMessage: 'Tên, email, mật khẩu và vai trò là bắt buộc' });
	}

	if (!['admin', 'requester', 'approver', 'implementer'].includes(body.role)) {
		throw createError({ statusCode: 400, statusMessage: 'Vai trò không hợp lệ' });
	}

	const db = useDB();

	const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
	if (existing) {
		throw createError({ statusCode: 409, statusMessage: 'Email đã được sử dụng' });
	}

	const passwordHash = await bcrypt.hash(body.password, 12);

	const userInsert = await db.insert(users).values({
		name: body.name,
		email: body.email,
		passwordHash,
		role: body.role,
		departmentId: body.departmentId ? Number(body.departmentId) : null,
		company: body.company ?? 'Xuân Cương',
		phone: body.phone ?? null,
	});
	const [user] = await db.select().from(users).where(eq(users.id, userInsert[0].insertId));

	const { passwordHash: _, ...safeUser } = user;
	return apiSuccess(safeUser, 'Tạo người dùng thành công');
});
