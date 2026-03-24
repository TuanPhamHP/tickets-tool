import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Bên yêu cầu nộp yêu cầu:
 *  - Tất cả loại → pending_review (chờ bên công nghệ xem xét và estimate)
 *  - Sau khi công nghệ review: type 1 → approved, type 2/3/4 → pending_approval
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'requester');

	const id = Number(getRouterParam(event, 'id'));
	const db = useDB();

	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền nộp yêu cầu này' });
	}

	if (!['draft', 'rejected'].includes(ticket.status)) {
		throw createError({ statusCode: 400, statusMessage: 'Chỉ có thể nộp yêu cầu ở trạng thái nháp hoặc bị từ chối' });
	}

	await db
		.update(tickets)
		.set({ status: 'pending_review', updatedAt: new Date() })
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'submitted',
		fromStatus: ticket.status,
		toStatus: 'pending_review',
		note: 'Nộp yêu cầu - Chờ bên công nghệ xem xét và estimate',
	});

	const actorId = Number(auth.sub);
	await notifyRole(db, 'implementer', actorId, 'submitted', id, `Yêu cầu mới "${ticket.title}" cần xem xét và estimate`);

	return apiSuccess(updated, 'Yêu cầu đã được nộp, đang chờ bên công nghệ xem xét');
});
