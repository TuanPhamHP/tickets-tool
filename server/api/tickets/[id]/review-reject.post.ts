import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Implementer từ chối yêu cầu trong giai đoạn BA (in_review → rejected).
 * Requester có thể chỉnh sửa và gửi lại.
 */
export default defineEventHandler(async event => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.reason?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'Lý do từ chối là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (ticket.status !== 'in_review') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái đang xem xét để từ chối' });
	}

	const now = new Date();
	await db.update(tickets).set({
		status: 'rejected',
		rejectionReason: body.reason.trim(),
		rejectedAt: now,
		updatedAt: now,
	}).where(eq(tickets.id, id));

	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'review_rejected',
		fromStatus: 'in_review',
		toStatus: 'rejected',
		note: `Từ chối (BA): ${body.reason.trim()}`,
	});

	await notify(db, ticket.requesterId, Number(auth.sub), 'rejected', id,
		`Yêu cầu "${ticket.title}" bị từ chối: ${body.reason.trim()}`);

	return apiSuccess(updated, 'Đã từ chối yêu cầu');
});
