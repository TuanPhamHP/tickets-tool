import { like, and, count, eq } from 'drizzle-orm';
import { departments, users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { getPagination, apiPaginated } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const query = getQuery(event) as Record<string, string>;
	const { page, limit, offset } = getPagination(query);

	const db = useDB();
	const conditions = [];

	if (query.search) conditions.push(like(departments.name, `%${query.search}%`));

	// requester / implementer chỉ thấy phòng ban của mình
	if (auth.role !== 'admin' && auth.role !== 'approver') {
		const [dbUser] = await db
			.select({ departmentId: users.departmentId })
			.from(users)
			.where(eq(users.id, Number(auth.sub)))
			.limit(1);

		if (!dbUser?.departmentId) {
			return apiPaginated([], 0, page, limit);
		}
		conditions.push(eq(departments.id, dbUser.departmentId));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalResult, items] = await Promise.all([
		db.select({ count: count() }).from(departments).where(where).then(r => r[0]),
		db.select().from(departments).where(where).limit(limit).offset(offset),
	]);

	return apiPaginated(items, totalResult?.count ?? 0, page, limit);
});
