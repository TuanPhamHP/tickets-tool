import { SignJWT, jwtVerify } from 'jose';
import type { H3Event } from 'h3';

export interface JwtPayload {
	sub: string; // user id
	email: string;
	role: string;
	name: string;
}

function getSecret() {
	const config = useRuntimeConfig();
	return new TextEncoder().encode(config.jwtSecret || 'xc-ticket-secret-key-2025');
}

export async function signToken(payload: JwtPayload, expiresIn: '7d' | '30d' = '7d'): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
	const { payload } = await jwtVerify(token, getSecret());
	return payload as unknown as JwtPayload;
}

export function getTokenFromEvent(event: H3Event): string | null {
	const authHeader = getHeader(event, 'authorization');
	if (authHeader?.startsWith('Bearer ')) {
		return authHeader.slice(7);
	}
	return getCookie(event, 'auth_token') ?? null;
}

export async function getUserFromEvent(event: H3Event): Promise<JwtPayload | null> {
	const token = getTokenFromEvent(event);
	if (!token) return null;
	try {
		return await verifyToken(token);
	}
	catch {
		return null;
	}
}

export async function requireAuth(event: H3Event): Promise<JwtPayload> {
	const user = await getUserFromEvent(event);
	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized - Vui lòng đăng nhập' });
	}
	return user;
}

export function requireRole(user: JwtPayload, ...roles: string[]) {
	if (!roles.includes(user.role)) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden - Bạn không có quyền thực hiện thao tác này' });
	}
}
