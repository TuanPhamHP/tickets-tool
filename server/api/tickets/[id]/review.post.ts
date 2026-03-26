import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';
import { notify, notifyRole } from '../../../utils/notify';

/**
 * Implementer hoàn thành BA, cung cấp báo giá và estimate.
 * in_review → pending_approval (type 2,3,4) hoặc approved (type 1)
 */
export default defineEventHandler(async event => {
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

	if (ticket.status !== 'in_review') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái đang xem xét (đã tiếp nhận) để thực hiện bước này' });
	}

	const newStatus = ticket.type === 1 ? 'approved' : 'pending_approval';
	const now = new Date();

	await db.update(tickets).set({
		status: newStatus,
		reviewerId: Number(auth.sub),
		estimateDays: Number(body.estimateDays),
		estimateCost: Number(body.estimateCost),
		estimateNote: body.estimateNote ?? null,
		estimateStartDate: body.estimateStartDate ? new Date(body.estimateStartDate) : null,
		reviewedAt: now,
		updatedAt: now,
	}).where(eq(tickets.id, id));

	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	const startDateStr = body.estimateStartDate
		? new Date(body.estimateStartDate).toLocaleDateString('vi-VN')
		: null;
	const actionNote = [
		`Hoàn thành BA — báo giá: ${Number(body.estimateCost).toLocaleString('vi-VN')}đ`,
		`${body.estimateDays} ngày thực hiện`,
		startDateStr ? `dự kiến bắt đầu ${startDateStr}` : null,
		body.estimateNote || null,
	].filter(Boolean).join(', ');

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'reviewed',
		fromStatus: 'in_review',
		toStatus: newStatus,
		note: actionNote,
	});

	const actorId = Number(auth.sub);
	if (ticket.type === 1) {
		await notify(db, ticket.requesterId, actorId, 'approved', id,
			`Yêu cầu "${ticket.title}" đã được xem xét và sẵn sàng thực hiện`);
		await notifyRole(db, 'implementer', actorId, 'approved', id,
			`Yêu cầu "${ticket.title}" đã sẵn sàng thực hiện`);
	} else {
		await notify(db, ticket.requesterId, actorId, 'reviewed', id,
			`Yêu cầu "${ticket.title}" đã có báo giá, đang chờ phê duyệt`);
		await notifyRole(db, 'approver', actorId, 'reviewed', id,
			`Yêu cầu "${ticket.title}" đã có báo giá và estimate, chờ phê duyệt`);
	}

	return apiSuccess(
		updated,
		ticket.type === 1
			? 'Đã hoàn thành BA — yêu cầu sẵn sàng thực hiện'
			: 'Đã hoàn thành BA — yêu cầu chờ phê duyệt từ Ban Giám Đốc',
	);
});
