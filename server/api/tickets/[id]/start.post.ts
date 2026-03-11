import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Bên thực hiện bắt đầu xử lý yêu cầu
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });
	if (ticket.status !== 'approved') throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái đã phê duyệt để bắt đầu thực hiện' });

	const now = new Date();
	await db.update(tickets).set({ status: 'in_progress', implementerId: Number(auth.sub), startedAt: now, updatedAt: now }).where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({ ticketId: id, userId: Number(auth.sub), action: 'started', fromStatus: 'approved', toStatus: 'in_progress', note: body?.note || 'Bắt đầu thực hiện yêu cầu' });
	await notify(db, ticket.requesterId, Number(auth.sub), 'started', id, `Yêu cầu "${ticket.title}" đang được thực hiện`);

	return apiSuccess(updated, 'Bắt đầu thực hiện yêu cầu');
});
