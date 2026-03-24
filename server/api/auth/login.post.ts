import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users } from '../../database/schema';
import { signToken } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	if (!body?.email || !body?.password) {
		throw createError({ statusCode: 400, statusMessage: 'Email và mật khẩu là bắt buộc' });
	}
	const rememberMe = !!body.rememberMe;

	const db = useDB();
	const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Email hoặc mật khẩu không đúng' });
	}

	const validPassword = await bcrypt.compare(body.password, user.passwordHash);
	if (!validPassword) {
		throw createError({ statusCode: 401, statusMessage: 'Email hoặc mật khẩu không đúng' });
	}

	if (!user.isActive) {
		throw createError({ statusCode: 403, statusMessage: 'Tài khoản của bạn đã bị tạm khoá bởi quản trị viên. Vui lòng liên hệ admin để được hỗ trợ.' });
	}

	const token = await signToken(
		{ sub: String(user.id), email: user.email, role: user.role, name: user.name },
		rememberMe ? '30d' : '7d',
	);

	// Set HTTP-only cookie
	setCookie(event, 'auth_token', token, {
		httpOnly: true,
		maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
		path: '/',
		sameSite: 'lax',
	});

	const { passwordHash: _, ...safeUser } = user;

	return apiSuccess({ token, user: safeUser }, 'Đăng nhập thành công');
});
