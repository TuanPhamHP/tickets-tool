import { eq } from 'drizzle-orm';
import { tickets, users, departments, ticketComments, ticketAttachments, ticketHistory } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const id = Number(getRouterParam(event, 'id'));
	if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' });

	const db = useDB();

	const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
	if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Yêu cầu không tồn tại' });

	// Access control
	if (
		auth.role === 'requester'
		&& ticket.requesterId !== Number(auth.sub)
	) {
		throw createError({ statusCode: 403, statusMessage: 'Bạn không có quyền xem yêu cầu này' });
	}

	// Load related data in parallel
	const [requester, approver, implementer, department, comments, attachments, history] = await Promise.all([
		db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
			.from(users).where(eq(users.id, ticket.requesterId)).limit(1).then(r => r[0]),
		ticket.approverId
			? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.approverId)).limit(1).then(r => r[0])
			: null,
		ticket.implementerId
			? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.implementerId)).limit(1).then(r => r[0])
			: null,
		ticket.departmentId
			? db.select().from(departments).where(eq(departments.id, ticket.departmentId)).limit(1).then(r => r[0])
			: null,
		db.select({
			comment: ticketComments,
			user: { id: users.id, name: users.name, avatar: users.avatar, role: users.role },
		})
			.from(ticketComments)
			.leftJoin(users, eq(ticketComments.userId, users.id))
			.where(eq(ticketComments.ticketId, id)),
		db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, id)),
		db.select({
			history: ticketHistory,
			user: { id: users.id, name: users.name, role: users.role },
		})
			.from(ticketHistory)
			.leftJoin(users, eq(ticketHistory.userId, users.id))
			.where(eq(ticketHistory.ticketId, id)),
	]);

	return apiSuccess({
		...ticket,
		requester,
		approver,
		implementer,
		department,
		comments,
		attachments,
		history,
	});
});
