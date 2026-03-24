import { eq, desc, count } from 'drizzle-orm';
import { ticketComments, users, tickets } from '../../../../database/schema';
import { requireAuth } from '../../../../utils/auth';
import { apiPaginated, getPagination } from '../../../../utils/response';

export default defineEventHandler(async (event) => {
	await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	const query = getQuery(event) as Record<string, string>;

	const db = useDB();
	const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	const { page, limit, offset } = getPagination({ ...query, limit: query.limit ?? '10' });

	const [[{ total }], comments] = await Promise.all([
		db.select({ total: count() }).from(ticketComments).where(eq(ticketComments.ticketId, id)),
		db
			.select({
				id: ticketComments.id,
				content: ticketComments.content,
				createdAt: ticketComments.createdAt,
				updatedAt: ticketComments.updatedAt,
				user: {
					id: users.id,
					name: users.name,
					avatar: users.avatar,
					role: users.role,
				},
			})
			.from(ticketComments)
			.leftJoin(users, eq(ticketComments.userId, users.id))
			.where(eq(ticketComments.ticketId, id))
			.orderBy(desc(ticketComments.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return apiPaginated(comments, total, page, limit);
});
