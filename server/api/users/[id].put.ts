import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));

	// Admin can edit anyone, users can edit themselves (limited fields)
	if (auth.role !== 'admin' && Number(auth.sub) !== id) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền chỉnh sửa người dùng này' });
	}

	const db = useDB();
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!user) throw createError({ statusCode: 404, statusMessage: 'Người dùng không tồn tại' });

	const body = await readBody(event);
	const updates: Record<string, any> = { updatedAt: new Date() };

	// Fields anyone can update for themselves
	if (body.name !== undefined) updates.name = body.name;
	if (body.phone !== undefined) updates.phone = body.phone;
	if (body.avatar !== undefined) updates.avatar = body.avatar;

	// Admin-only fields
	if (auth.role === 'admin') {
		if (body.role !== undefined) updates.role = body.role;
		if (body.departmentId !== undefined) updates.departmentId = body.departmentId ? Number(body.departmentId) : null;
		if (body.company !== undefined) updates.company = body.company;
		if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
		if (body.password) {
			updates.passwordHash = await bcrypt.hash(body.password, 12);
		}
	}

	await db.update(users).set(updates).where(eq(users.id, id));
	const [updated] = await db.select().from(users).where(eq(users.id, id));
	const { passwordHash: _, ...safeUser } = updated;
	return apiSuccess(safeUser, 'Cập nhật người dùng thành công');
});
