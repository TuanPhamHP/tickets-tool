import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Bên thực hiện hoàn tất xử lý yêu cầu, bàn giao cho bên yêu cầu nghiệm thu
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });
	if (ticket.status !== 'in_progress') throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái đang thực hiện để hoàn tất' });
	if (auth.role !== 'admin' && ticket.implementerId !== Number(auth.sub)) throw createError({ statusCode: 403, statusMessage: 'Bạn không phải người thực hiện yêu cầu này' });

	const now = new Date();
	await db.update(tickets).set({ status: 'completed', completedAt: now, implementationNote: body?.note ?? null, updatedAt: now }).where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({ ticketId: id, userId: Number(auth.sub), action: 'completed', fromStatus: 'in_progress', toStatus: 'completed', note: body?.note || 'Hoàn tất thực hiện, bàn giao nghiệm thu' });
	await notify(db, ticket.requesterId, Number(auth.sub), 'completed', id, `Yêu cầu "${ticket.title}" đã hoàn tất, chờ nghiệm thu`);

	return apiSuccess(updated, 'Hoàn tất yêu cầu, chờ nghiệm thu từ bên yêu cầu');
});
