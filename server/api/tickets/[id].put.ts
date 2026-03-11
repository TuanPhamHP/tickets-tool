import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async event => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' });

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	// Only requester (owner) or admin can edit
	if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền chỉnh sửa yêu cầu này' });
	}

	// Can only edit in draft or rejected state
	if (!['draft', 'rejected', 'pending_approval'].includes(ticket.status)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Chỉ có thể chỉnh sửa yêu cầu ở trạng thái nháp, chờ duyệt hoặc bị từ chối',
		});
	}

	const body = await readBody(event);
	const allowedFields = ['title', 'description', 'type', 'priority', 'departmentId', 'deadline'];
	const updates: Record<string, any> = { updatedAt: new Date() };

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			if (field === 'deadline') updates.deadline = body.deadline ? new Date(body.deadline) : null;
			else if (field === 'departmentId') updates.departmentId = body.departmentId ? Number(body.departmentId) : null;
			else if (field === 'type') updates.type = Number(body.type);
			else updates[field] = body[field];
		}
	}

	await db.update(tickets).set(updates).where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'updated',
		fromStatus: ticket.status,
		toStatus: ticket.status,
		note: 'Cập nhật thông tin yêu cầu',
	});

	return apiSuccess(updated, 'Cập nhật yêu cầu thành công');
});
