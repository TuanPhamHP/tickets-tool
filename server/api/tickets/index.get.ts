import { eq, and, desc, like, count, sql } from 'drizzle-orm';
import { tickets, users, departments } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { getPagination, apiPaginated } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const query = getQuery(event) as Record<string, string>;
	const { page, limit, offset } = getPagination(query);

	const db = useDB();
	const conditions = [];

	// Role-based filtering
	if (auth.role === 'requester') {
		conditions.push(eq(tickets.requesterId, Number(auth.sub)));
	}
	else if (auth.role === 'approver') {
		conditions.push(
			sql`(${tickets.approverId} = ${Number(auth.sub)} OR ${tickets.status} IN ('pending_approval'))`,
		);
	}
	else if (auth.role === 'implementer') {
		conditions.push(
			sql`(${tickets.implementerId} = ${Number(auth.sub)} OR ${tickets.status} IN ('pending_review','approved','in_progress','completed'))`,
		);
	}

	// Filters
	if (query.status) conditions.push(eq(tickets.status, query.status as any));
	if (query.type) conditions.push(eq(tickets.type, Number(query.type)));
	if (query.priority) conditions.push(eq(tickets.priority, query.priority as any));
	if (query.search) conditions.push(like(tickets.title, `%${query.search}%`));
	if (query.departmentId) conditions.push(eq(tickets.departmentId, Number(query.departmentId)));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalResult, items] = await Promise.all([
		db.select({ count: count() }).from(tickets).where(where).then(r => r[0]),
		db
			.select({
				ticket: tickets,
				requester: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
				},
				department: departments,
			})
			.from(tickets)
			.leftJoin(users, eq(tickets.requesterId, users.id))
			.leftJoin(departments, eq(tickets.departmentId, departments.id))
			.where(where)
			.orderBy(desc(tickets.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	const total = totalResult?.count ?? 0;
	return apiPaginated(items, total, page, limit);
});
