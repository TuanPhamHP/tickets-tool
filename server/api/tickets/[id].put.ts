import { eq, inArray } from 'drizzle-orm';
import { tickets, ticketHistory, departments } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

const TYPE_NAMES: Record<number, string> = {
	1: 'Xử lý vận hành',
	2: 'Thay đổi & Tối ưu',
	3: 'Trích xuất dữ liệu',
	4: 'Phát triển tính năng mới',
};

const PRIORITY_NAMES: Record<string, string> = {
	low: 'Thấp',
	medium: 'Trung bình',
	high: 'Cao',
	urgent: 'Khẩn cấp',
};

const PLATFORM_NAMES: Record<string, string> = {
	web_khach_hang: 'Web Khách hàng',
	app_giao_dich: 'App Giao dịch',
	app_dieu_phoi: 'App Điều phối',
	app_to_doi: 'App Tổ đội',
	app_coi_bat: 'App Cởi bạt',
};

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

	// Can only edit in editable states (requester can edit while waiting for tech review)
	if (!['draft', 'rejected', 'pending_review', 'pending_approval'].includes(ticket.status)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Chỉ có thể chỉnh sửa yêu cầu ở trạng thái nháp, chờ xem xét, chờ duyệt hoặc bị từ chối. Khi đã tiếp nhận (đang xem xét) không thể chỉnh sửa.',
		});
	}

	const body = await readBody(event);
	const allowedFields = ['title', 'description', 'type', 'priority', 'departmentId', 'platformIds', 'deadline'];
	const updates: Record<string, any> = { updatedAt: new Date() };

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			if (field === 'deadline') updates.deadline = body.deadline ? new Date(body.deadline) : null;
			else if (field === 'departmentId') updates.departmentId = body.departmentId ? Number(body.departmentId) : null;
			else if (field === 'type') updates.type = Number(body.type);
			else if (field === 'platformIds') updates.platformIds = Array.isArray(body.platformIds) ? body.platformIds : null;
			else updates[field] = body[field];
		}
	}

	// Build detailed change note
	const changedParts: string[] = [];

	if (body.title !== undefined && body.title !== ticket.title) {
		changedParts.push(`Tiêu đề: "${ticket.title}" → "${body.title}"`);
	}

	if (body.description !== undefined && body.description !== ticket.description) {
		changedParts.push('Mô tả: đã cập nhật');
	}

	if (body.type !== undefined && Number(body.type) !== ticket.type) {
		const oldName = TYPE_NAMES[ticket.type] ?? `Loại ${ticket.type}`;
		const newName = TYPE_NAMES[Number(body.type)] ?? `Loại ${body.type}`;
		changedParts.push(`Loại yêu cầu: ${oldName} → ${newName}`);
	}

	if (body.priority !== undefined && body.priority !== ticket.priority) {
		const oldName = PRIORITY_NAMES[ticket.priority ?? ''] ?? ticket.priority ?? '—';
		const newName = PRIORITY_NAMES[body.priority] ?? body.priority;
		changedParts.push(`Ưu tiên: ${oldName} → ${newName}`);
	}

	if (body.departmentId !== undefined) {
		const oldId = ticket.departmentId;
		const newId = body.departmentId ? Number(body.departmentId) : null;
		if (oldId !== newId) {
			const deptIds = [oldId, newId].filter((v): v is number => v !== null);
			const deptRows = deptIds.length > 0
				? await db.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, deptIds))
				: [];
			const deptMap = Object.fromEntries(deptRows.map(d => [d.id, d.name]));
			const oldName = oldId ? (deptMap[oldId] ?? `ID ${oldId}`) : 'không có';
			const newName = newId ? (deptMap[newId] ?? `ID ${newId}`) : 'không có';
			changedParts.push(`Phòng ban: ${oldName} → ${newName}`);
		}
	}

	if (body.platformIds !== undefined) {
		const oldList = (ticket.platformIds as string[] | null) ?? [];
		const newList = Array.isArray(body.platformIds) ? body.platformIds : [];
		const oldSorted = [...oldList].sort().join(',');
		const newSorted = [...newList].sort().join(',');
		if (oldSorted !== newSorted) {
			const fmt = (list: string[]) => list.length > 0
				? list.map(v => PLATFORM_NAMES[v] ?? v).join(', ')
				: 'không có';
			changedParts.push(`Nền tảng: [${fmt(oldList)}] → [${fmt(newList)}]`);
		}
	}

	if (body.deadline !== undefined) {
		const oldDeadline = ticket.deadline ? new Date(ticket.deadline).toLocaleDateString('vi-VN') : 'không có';
		const newDeadline = body.deadline ? new Date(body.deadline).toLocaleDateString('vi-VN') : 'không có';
		if (oldDeadline !== newDeadline) {
			changedParts.push(`Deadline: ${oldDeadline} → ${newDeadline}`);
		}
	}

	const note = changedParts.length > 0
		? `Cập nhật: ${changedParts.join('; ')}`
		: 'Cập nhật thông tin yêu cầu';

	await db.update(tickets).set(updates).where(eq(tickets.id, id));
	const [updated] = await db.select().from(tickets).where(eq(tickets.id, id));

	await db.insert(ticketHistory).values({
		ticketId: id,
		userId: Number(auth.sub),
		action: 'updated',
		fromStatus: ticket.status,
		toStatus: ticket.status,
		note,
	});

	return apiSuccess(updated, 'Cập nhật yêu cầu thành công');
});
