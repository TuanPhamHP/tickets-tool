import { like, and, count } from 'drizzle-orm';
import { departments } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { getPagination, apiPaginated } from '../../utils/response';

export default defineEventHandler(async (event) => {
	await requireAuth(event);
	const query = getQuery(event) as Record<string, string>;
	const { page, limit, offset } = getPagination(query);

	const db = useDB();
	const conditions = [];
	if (query.search) conditions.push(like(departments.name, `%${query.search}%`));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalResult, items] = await Promise.all([
		db.select({ count: count() }).from(departments).where(where).then(r => r[0]),
		db.select().from(departments).where(where).limit(limit).offset(offset),
	]);

	return apiPaginated(items, totalResult?.count ?? 0, page, limit);
});
