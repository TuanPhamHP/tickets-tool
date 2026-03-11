import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Bên phê duyệt (Tổng Giám Đốc / Ban Giám Đốc) phê duyệt yêu cầu
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'approver');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

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
			status: 'approved',
			approverId: Number(auth.sub),
			approvalNote: body?.note ?? null,
			approvedAt: now,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'approved',
		fromStatus: 'pending_approval',
		toStatus: 'approved',
		note: body?.note || 'Phê duyệt yêu cầu',
	});

	const actorId = Number(auth.sub);
	await notify(db, ticket.requesterId, actorId, 'approved', id, `Yêu cầu "${ticket.title}" đã được phê duyệt`);
	await notifyRole(db, 'implementer', actorId, 'approved', id, `Yêu cầu "${ticket.title}" đã được duyệt, sẵn sàng thực hiện`);

	return apiSuccess(updated, 'Phê duyệt yêu cầu thành công');
});
