import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const body = await readBody(event);

	if (!body?.currentPassword || !body?.newPassword) {
		throw createError({ statusCode: 400, statusMessage: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
	}

	if (body.newPassword.length < 6) {
		throw createError({ statusCode: 400, statusMessage: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
	}

	const db = useDB();
	const [user] = await db.select().from(users).where(eq(users.id, Number(auth.sub))).limit(1);
	if (!user) throw createError({ statusCode: 404, statusMessage: 'Người dùng không tồn tại' });

	const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
	if (!valid) throw createError({ statusCode: 400, statusMessage: 'Mật khẩu hiện tại không đúng' });

	const passwordHash = await bcrypt.hash(body.newPassword, 12);
	await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));

	return apiSuccess(null, 'Đổi mật khẩu thành công');
});
