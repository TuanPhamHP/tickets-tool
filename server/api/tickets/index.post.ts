import { eq } from 'drizzle-orm';
import { tickets, ticketHistory } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';
import { generateTicketCode } from '../../utils/db';

export default defineEventHandler(async event => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'requester');

	const body = await readBody(event);

	if (!body?.title) throw createError({ statusCode: 400, statusMessage: 'Tiêu đề yêu cầu là bắt buộc' });
	if (!body?.type || ![1, 2, 3, 4].includes(Number(body.type))) {
		throw createError({ statusCode: 400, statusMessage: 'Loại yêu cầu phải là 1, 2, 3 hoặc 4' });
	}

	const db = useDB();
	const code = await generateTicketCode();

	// Tất cả loại đều bắt đầu từ draft — luồng: draft → submit → pending_review → ...
	const initialStatus = 'draft' as const;

	const insertResult = await db.insert(tickets).values({
		code,
		title: body.title,
		description: body.description,
		type: Number(body.type),
		status: initialStatus,
		priority: body.priority || 'medium',
		requesterId: Number(auth.sub),
		departmentId: body.departmentId || body.department_id ? Number(body.departmentId || body.department_id) : null,
		deadline: body.deadline ? new Date(body.deadline) : null,
	});
	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, insertResult[0].insertId));

	await db.insert(ticketHistory).values({
		ticketId: ticket.id,
		userId: Number(auth.sub),
		action: 'created',
		toStatus: initialStatus,
		note: `Tạo yêu cầu mới: ${ticket.title}`,
	});

	return apiSuccess(ticket, 'Tạo yêu cầu thành công');
});
