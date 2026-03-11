import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Bên yêu cầu nộp yêu cầu:
 *  - Type 1 → approved (không cần phê duyệt, sẵn sàng thực hiện)
 *  - Type 2, 3 → pending_approval
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

	const newStatus = ticket.type === 1 ? 'approved' : 'pending_approval';
	await db
		.update(tickets)
		.set({ status: newStatus, updatedAt: new Date() })
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	const actionNote = ticket.type === 1
		? 'Nộp yêu cầu - Loại Hỗ trợ vận hành, tự động phê duyệt'
		: 'Nộp yêu cầu - Chờ phê duyệt từ Ban Giám Đốc';

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'submitted',
		fromStatus: ticket.status,
		toStatus: newStatus,
		note: actionNote,
	});

	const actorId = Number(auth.sub);
	if (ticket.type === 1) {
		await notifyRole(db, 'implementer', actorId, 'submitted', id, `Yêu cầu mới "${ticket.title}" cần thực hiện`);
	} else {
		await notifyRole(db, 'approver', actorId, 'submitted', id, `Yêu cầu mới "${ticket.title}" chờ phê duyệt`);
	}

	return apiSuccess(updated, ticket.type === 1 ? 'Yêu cầu đã được nộp và sẵn sàng thực hiện' : 'Yêu cầu đã được nộp, đang chờ phê duyệt');
});
