import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify } from '../../../utils/notify';

/**
 * Implementer tiếp nhận yêu cầu để bắt đầu phân tích BA và báo giá.
 * pending_review → in_review
 */
export default defineEventHandler(async event => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (ticket.status !== 'pending_review') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái chờ xem xét để tiếp nhận' });
	}

	const now = new Date();
	await db
		.update(tickets)
		.set({
			status: 'in_review',
			implementerId: Number(auth.sub),
			receivedAt: now,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));

	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'received',
		fromStatus: 'pending_review',
		toStatus: 'in_review',
		note: 'Đã tiếp nhận yêu cầu, đang phân tích yêu cầu',
	});

	await notify(
		db,
		ticket.requesterId,
		Number(auth.sub),
		'received',
		id,
		`Yêu cầu "${ticket.title}" đã được tiếp nhận, đang phân tích yêu cầu.`,
	);

	return apiSuccess(updated, 'Đã tiếp nhận yêu cầu');
});
