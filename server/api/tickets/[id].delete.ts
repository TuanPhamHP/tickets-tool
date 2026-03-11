import { eq } from 'drizzle-orm';
import { tickets } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' });

	const db = useDB();
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền xóa yêu cầu này' });
	}

	if (!['draft', 'rejected', 'cancelled'].includes(ticket.status)) {
		throw createError({ statusCode: 400, statusMessage: 'Chỉ có thể xóa yêu cầu ở trạng thái nháp, bị từ chối hoặc đã huỷ' });
	}

	await db.delete(tickets).where(eq(tickets.id, id));
	return apiSuccess(null, 'Xóa yêu cầu thành công');
});
