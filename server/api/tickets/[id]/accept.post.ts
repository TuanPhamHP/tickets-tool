import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Bên yêu cầu nghiệm thu và xác nhận hoàn thành
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'requester');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });
	if (ticket.status !== 'completed') throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái hoàn tất để nghiệm thu' });
	if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) throw createError({ statusCode: 403, statusMessage: 'Bạn không phải người yêu cầu ban đầu' });

	const now = new Date();
	await db.update(tickets).set({ status: 'accepted', acceptedAt: now, acceptanceNote: body?.note ?? null, updatedAt: now }).where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({ ticketId: id, userId: Number(auth.sub), action: 'accepted', fromStatus: 'completed', toStatus: 'accepted', note: body?.note || 'Nghiệm thu và xác nhận hoàn thành yêu cầu' });
	if (ticket.implementerId) {
		await notify(db, ticket.implementerId, Number(auth.sub), 'accepted', id, `Yêu cầu "${ticket.title}" đã được nghiệm thu thành công`);
	}

	return apiSuccess(updated, 'Nghiệm thu thành công, yêu cầu đã hoàn thành');
});
