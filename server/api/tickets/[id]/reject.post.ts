import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Bên phê duyệt từ chối yêu cầu
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'approver');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.reason) {
		throw createError({ statusCode: 400, statusMessage: 'Lý do từ chối là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (ticket.status !== 'pending_approval') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu không ở trạng thái chờ phê duyệt' });
	}

	const now = new Date();
	await db
		.update(tickets)
		.set({
			status: 'rejected',
			approverId: Number(auth.sub),
			rejectionReason: body.reason,
			rejectedAt: now,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'rejected',
		fromStatus: 'pending_approval',
		toStatus: 'rejected',
		note: body.reason,
	});

	await notify(db, ticket.requesterId, Number(auth.sub), 'rejected', id, `Yêu cầu "${ticket.title}" đã bị từ chối`);

	return apiSuccess(updated, 'Đã từ chối yêu cầu');
});
