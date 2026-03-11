import { eq, desc, count, and } from 'drizzle-orm';
import { notifications, users, tickets } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { getPagination } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const userId = Number(auth.sub);

	const query = getQuery(event) as Record<string, string>;
	const { page, limit, offset } = getPagination(query);

	const db = useDB();

	const actor = users;

	const [totalResult, items, unreadResult] = await Promise.all([
		db.select({ count: count() })
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.then(r => r[0]),

		db.select({
			id: notifications.id,
			type: notifications.type,
			message: notifications.message,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
			ticketId: notifications.ticketId,
			ticketCode: tickets.code,
			ticketTitle: tickets.title,
			actorId: notifications.actorId,
			actorName: actor.name,
			actorAvatar: actor.avatar,
		})
			.from(notifications)
			.leftJoin(tickets, eq(notifications.ticketId, tickets.id))
			.leftJoin(actor, eq(notifications.actorId, actor.id))
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset),

		db.select({ count: count() })
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
			.then(r => r[0]),
	]);

	return {
		success: true,
		data: items,
		meta: {
			total: totalResult?.count ?? 0,
			page,
			limit,
			totalPages: Math.ceil((totalResult?.count ?? 0) / limit),
			unreadCount: unreadResult?.count ?? 0,
		},
	};
});
