import { eq, desc } from 'drizzle-orm';
import { ticketComments, users, tickets } from '../../../../database/schema';
import { requireAuth } from '../../../../utils/auth';
import { apiSuccess } from '../../../../utils/response';

export default defineEventHandler(async (event) => {
	await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));

	const db = useDB();
	const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	const comments = await db
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
		.orderBy(desc(ticketComments.createdAt));

	return apiSuccess(comments);
});
