import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../../database/schema';
import { requireAuth, requireRole } from '../../../utils/auth';
import { apiSuccess } from '../../../utils/response';

/**
 * Bên thực hiện phân tích và báo estimate trước khi bắt đầu
 */
export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'implementer');

	const id = Number(getRouterParam(event, 'id'));
	const body = await readBody(event);

	if (!body?.estimateHours) {
		throw createError({ statusCode: 400, statusMessage: 'Số giờ dự kiến là bắt buộc' });
	}

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (ticket.status !== 'approved') {
		throw createError({ statusCode: 400, statusMessage: 'Yêu cầu phải ở trạng thái đã phê duyệt để báo estimate' });
	}

	const now = new Date();
	await db
		.update(tickets)
		.set({
			implementerId: Number(auth.sub),
			estimateHours: Number(body.estimateHours),
			estimateNote: body.estimateNote ?? null,
			estimatedAt: now,
			updatedAt: now,
		})
		.where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'estimated',
		fromStatus: ticket.status,
		toStatus: ticket.status,
		note: `Báo estimate: ${body.estimateHours} giờ. ${body.estimateNote || ''}`.trim(),
	});

	return apiSuccess(updated, `Đã báo estimate: ${body.estimateHours} giờ`);
});
