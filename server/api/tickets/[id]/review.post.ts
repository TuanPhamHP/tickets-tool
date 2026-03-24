import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Bên công nghệ (implementer) xem xét, estimate và chuyển trạng thái:
 *  - Type 1 (Xử lý vận hành)     → approved (không cần phê duyệt BGĐ)
 *  - Type 2, 3, 4                 → pending_approval (chờ Phó TGĐ phê duyệt)
 *
 * estimateCost chỉ hiển thị cho approver/admin ở frontend.
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.estimateDays || Number(body.estimateDays) <= 0) {
		throw createError({ statusCode: 400, statusMessage: 'Số ngày dự kiến là bắt buộc và phải lớn hơn 0' });
	}
	if (body.estimateCost === undefined || body.estimateCost === null || body.estimateCost === '') {
		throw createError({ statusCode: 400, statusMessage: 'Chi phí dự kiến là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (ticket.status !== 'pending_review') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái chờ xem xét để thực hiện bước này' });
	}

	const newStatus = ticket.type === 1 ? 'approved' : 'pending_approval';
	const now = new Date();

	await db
		.update(tickets)
		.set({
			status: newStatus,
			reviewerId: Number(auth.sub),
			implementerId: Number(auth.sub),
			estimateDays: Number(body.estimateDays),
			estimateCost: Number(body.estimateCost),
			estimateNote: body.estimateNote ?? null,
			reviewedAt: now,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	const actionNote = `Estimate: ${body.estimateDays} ngày, chi phí dự kiến đã được ghi nhận. ${body.estimateNote || ''}`.trim();

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'reviewed',
		fromStatus: 'pending_review',
		toStatus: newStatus,
		note: actionNote,
	});

	const actorId = Number(auth.sub);
	if (ticket.type === 1) {
		// Type 1: tự động approved → thông báo implementer chuẩn bị thực hiện
		await notify(db, ticket.requesterId, actorId, 'approved', id, `Yêu cầu "${ticket.title}" đã được xem xét và sẵn sàng thực hiện`);
		await notifyRole(db, 'implementer', actorId, 'approved', id, `Yêu cầu "${ticket.title}" đã sẵn sàng thực hiện`);
	} else {
		// Types 2, 3, 4 → thông báo approver phê duyệt
		await notify(db, ticket.requesterId, actorId, 'reviewed', id, `Yêu cầu "${ticket.title}" đã được xem xét, đang chờ phê duyệt`);
		await notifyRole(db, 'approver', actorId, 'reviewed', id, `Yêu cầu "${ticket.title}" đã có estimate, chờ phê duyệt`);
	}

	return apiSuccess(
		updated,
		ticket.type === 1
			? 'Đã xem xét — yêu cầu sẵn sàng thực hiện'
			: 'Đã xem xét — yêu cầu chờ phê duyệt từ Phó Tổng Giám Đốc',
	);
});
