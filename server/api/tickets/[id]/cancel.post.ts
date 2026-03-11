import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Huỷ yêu cầu (requester hoặc admin)
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.reason) {
		throw createError({ statusCode: 400, statusMessage: 'Lý do huỷ là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền huỷ yêu cầu này' });
	}

	const cancellableStatuses = ['draft', 'pending_approval', 'approved', 'rejected'];
	if (!cancellableStatuses.includes(ticket.status)) {
		throw createError({ statusCode: 400, statusMessage: 'Không thể huỷ yêu cầu đang hoặc đã thực hiện' });
	}

	const now = new Date();
	await db
		.update(tickets)
		.set({
			status: 'cancelled',
			cancelledAt: now,
			cancelReason: body.reason,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'cancelled',
		fromStatus: ticket.status,
		toStatus: 'cancelled',
		note: body.reason,
	});

	const actorId = Number(auth.sub);
	const cancellerId = actorId;
	// Notify implementer if assigned
	if (ticket.implementerId && ticket.implementerId !== cancellerId) {
		await notify(db, ticket.implementerId, actorId, 'cancelled', id, `Yêu cầu "${ticket.title}" đã bị huỷ`);
	}
	// Notify approvers
	await notifyRole(db, 'approver', actorId, 'cancelled', id, `Yêu cầu "${ticket.title}" đã bị huỷ`);
	// If admin cancelled, notify requester
	if (auth.role === 'admin' && ticket.requesterId !== actorId) {
		await notify(db, ticket.requesterId, actorId, 'cancelled', id, `Yêu cầu "${ticket.title}" của bạn đã bị huỷ`);
	}

	return apiSuccess(updated, 'Đã huỷ yêu cầu');
});
