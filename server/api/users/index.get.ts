import { eq, like, and, count } from 'drizzle-orm';
import { users, departments } from '../../database/schema';
import { requireAuth, requireRole } from '../../utils/auth';
import { getPagination, apiPaginated } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	requireRole(auth, 'admin', 'approver');

	const query = getQuery(event) as Record<string, string>;
	const { page, limit, offset } = getPagination(query);

	const db = useDB();
	const conditions = [];

	if (query.role) conditions.push(eq(users.role, query.role as any));
	if (query.search) conditions.push(like(users.name, `%${query.search}%`));
	if (query.departmentId) conditions.push(eq(users.departmentId, Number(query.departmentId)));
	if (query.isActive !== undefined) conditions.push(eq(users.isActive, query.isActive === 'true'));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalResult, items] = await Promise.all([
		db.select({ count: count() }).from(users).where(where).then(r => r[0]),
		db.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			company: users.company,
			phone: users.phone,
			avatar: users.avatar,
			isActive: users.isActive,
			createdAt: users.createdAt,
			department: departments,
		})
			.from(users)
			.leftJoin(departments, eq(users.departmentId, departments.id))
			.where(where)
			.limit(limit)
			.offset(offset),
	]);

	return apiPaginated(items, totalResult?.count ?? 0, page, limit);
});
