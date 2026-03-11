import { eq } from 'drizzle-orm';
import { ticketComments, tickets } from '../../../../database/schema';
import { requireAuth } from '../../../../utils/auth';
import { apiSuccess } from '../../../../utils/response';
import { notify, notifyMentions } from '../../../../utils/notify';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.content?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'Nội dung bình luận là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	const commentInsert = await db
		.insert(ticketComments)
		.values({
			ticketId: id,
			userId: Number(auth.sub),
			content: body.content.trim(),
		});
	const [comment] = await db.select().from(ticketComments).where(eq(ticketComments.id, commentInsert[0].insertId));

	const actorId = Number(auth.sub);
	// Notify @mentioned users
	await notifyMentions(db, body.content.trim(), actorId, id, ticket.title);
	// Notify ticket requester about new comment (if not the commenter)
	if (ticket.requesterId !== actorId) {
		await notify(db, ticket.requesterId, actorId, 'commented', id, `Có bình luận mới trên yêu cầu "${ticket.title}"`);
	}

	return apiSuccess(comment, 'Đã thêm bình luận');
});
