import { inArray, eq } from 'drizzle-orm';
import { notifications, users } from '../database/schema';

type DB = ReturnType<typeof useDB>;

/**
 * Gửi thông báo cho một user cụ thể (bỏ qua nếu actorId === userId)
 */
export async function notify(
	db: DB,
	userId: number,
	actorId: number,
	type: string,
	ticketId: number,
	message: string,
) {
	if (userId === actorId) return;
	await db.insert(notifications).values({ userId, actorId, type, ticketId, message });
}

/**
 * Gửi thông báo cho nhiều users theo role
 */
export async function notifyRole(
	db: DB,
	role: string,
	actorId: number,
	type: string,
	ticketId: number,
	message: string,
) {
	const targets = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, role as any));

	const inserts = targets
		.filter(u => u.id !== actorId)
		.map(u => ({ userId: u.id, actorId, type, ticketId, message }));

	if (inserts.length > 0) {
		await db.insert(notifications).values(inserts);
	}
}

/**
 * Parse @[Tên] mentions từ nội dung comment, trả về danh sách tên
 */
export function parseMentions(content: string): string[] {
	const matches = [...content.matchAll(/@\[([^\]]+)\]/g)];
	return [...new Set(matches.map(m => m[1]))];
}

/**
 * Gửi thông báo cho các user được mention trong comment
 */
export async function notifyMentions(
	db: DB,
	content: string,
	actorId: number,
	ticketId: number,
	ticketTitle: string,
) {
	const names = parseMentions(content);
	if (names.length === 0) return;

	const targets = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(inArray(users.name, names));

	const inserts = targets
		.filter(u => u.id !== actorId)
		.map(u => ({
			userId: u.id,
			actorId,
			type: 'mentioned',
			ticketId,
			message: `Bạn được nhắc đến trong bình luận tại yêu cầu "${ticketTitle}"`,
		}));

	if (inserts.length > 0) {
		await db.insert(notifications).values(inserts);
	}
}
