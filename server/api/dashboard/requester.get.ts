import { eq, and, gte, lte, count, sql, ne } from 'drizzle-orm';
import { tickets, departments } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';
import { subDays, differenceInDays, format } from 'date-fns';

function parseDateRange(from: string | undefined, to: string | undefined) {
	const toDate = to ? new Date(to) : new Date();
	toDate.setHours(23, 59, 59, 999);
	const fromDate = from ? new Date(from) : subDays(toDate, 30);
	fromDate.setHours(0, 0, 0, 0);
	return { fromDate, toDate };
}

function getPrevPeriod(fromDate: Date, toDate: Date) {
	const diffMs = toDate.getTime() - fromDate.getTime();
	const prevTo = new Date(fromDate.getTime() - 1);
	const prevFrom = new Date(prevTo.getTime() - diffMs);
	return { prevFrom, prevTo };
}

export default defineEventHandler(async event => {
	const auth = await requireAuth(event);
	if (!['admin', 'requester'].includes(auth.role)) {
		throw createError({ statusCode: 403, statusMessage: 'Không có quyền truy cập' });
	}

	const query = getQuery(event) as Record<string, string>;
	const { fromDate, toDate } = parseDateRange(query.from, query.to);
	const { prevFrom, prevTo } = getPrevPeriod(fromDate, toDate);

	const db = useDB();
	const userId = Number(auth.sub);

	const myTickets = eq(tickets.requesterId, userId);

	// ─── STAT CARDS ────────────────────────────────────────────────────────────

	const [openCount, rejectedCount, awaitingCount, completedCurrent, completedPrev] = await Promise.all([
		db.select({ c: count() }).from(tickets)
			.where(and(
				myTickets,
				sql`${tickets.status} NOT IN ('completed','accepted','cancelled')`,
			))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(myTickets, eq(tickets.status, 'rejected')))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(myTickets, eq(tickets.status, 'completed')))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				myTickets,
				eq(tickets.status, 'accepted'),
				gte(tickets.acceptedAt, fromDate),
				lte(tickets.acceptedAt, toDate),
			))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				myTickets,
				eq(tickets.status, 'accepted'),
				gte(tickets.acceptedAt, prevFrom),
				lte(tickets.acceptedAt, prevTo),
			))
			.then(r => r[0]?.c ?? 0),
	]);

	// ─── STATUS DISTRIBUTION ─────────────────────────────────────────────────

	const statusDist = await db
		.select({ status: tickets.status, c: count() })
		.from(tickets)
		.where(and(myTickets, ne(tickets.status, 'draft')))
		.groupBy(tickets.status);

	// ─── MONTHLY SUBMISSION TREND (last 6 months) ────────────────────────────

	const monthlyResult = await db.execute(sql`
		SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS c
		FROM tickets
		WHERE requester_id = ${userId}
		  AND created_at >= ${subDays(toDate, 180)}
		GROUP BY month
		ORDER BY month
	`) as any;
	const monthlyRaw: any[] = Array.isArray(monthlyResult) && Array.isArray(monthlyResult[0])
		? monthlyResult[0]
		: (monthlyResult.rows ?? []);

	// ─── TYPE BREAKDOWN ──────────────────────────────────────────────────────

	const typeBreakdown = await db
		.select({ type: tickets.type, c: count() })
		.from(tickets)
		.where(and(myTickets, gte(tickets.createdAt, fromDate), lte(tickets.createdAt, toDate)))
		.groupBy(tickets.type);

	// ─── AVG RESOLUTION TIME BY TYPE ────────────────────────────────────────

	const resolutionRaw = await db.execute(sql`
		SELECT
			type,
			AVG(DATEDIFF(${tickets.completedAt}, ${tickets.approvedAt})) AS avg_days
		FROM ${tickets}
		WHERE requester_id = ${userId}
			AND ${tickets.status} IN ('completed','accepted')
			AND ${tickets.completedAt} IS NOT NULL
			AND ${tickets.approvedAt} IS NOT NULL
		GROUP BY type
	`) as any;

	const resRows = Array.isArray(resolutionRaw) && Array.isArray(resolutionRaw[0])
		? resolutionRaw[0]
		: (resolutionRaw.rows ?? []);

	// ─── ACTIVE TICKETS TABLE ────────────────────────────────────────────────

	const activeTickets = await db
		.select({
			id: tickets.id,
			code: tickets.code,
			title: tickets.title,
			type: tickets.type,
			status: tickets.status,
			updatedAt: tickets.updatedAt,
			createdAt: tickets.createdAt,
		})
		.from(tickets)
		.where(and(
			myTickets,
			sql`${tickets.status} NOT IN ('cancelled')`,
			gte(tickets.createdAt, fromDate),
			lte(tickets.createdAt, toDate),
		))
		.orderBy(sql`FIELD(${tickets.status},'rejected','completed') DESC, ${tickets.updatedAt} DESC`);

	const now = new Date();

	return apiSuccess({
		stats: {
			openTickets: { value: Number(openCount) },
			actionRequired: { value: Number(rejectedCount) },
			awaitingAcceptance: { value: Number(awaitingCount) },
			completedThisMonth: { value: Number(completedCurrent), previousValue: Number(completedPrev) },
		},
		statusDistribution: statusDist.map(r => ({ status: r.status, count: Number(r.c) })),
		monthlyTrend: {
			labels: monthlyRaw.map((r: any) => String(r.month)),
			data: monthlyRaw.map((r: any) => Number(r.c)),
		},
		typeBreakdown: [1, 2, 3, 4].map(t => {
			const row = typeBreakdown.find(r => r.type === t);
			return { type: t, count: row ? Number(row.c) : 0 };
		}),
		avgResolutionTime: [1, 2, 3, 4].map(t => {
			const row = resRows.find((r: any) => Number(r.type) === t);
			return { type: t, avgDays: row ? Math.round(Number(row.avg_days) || 0) : 0 };
		}),
		activeTickets: activeTickets.map(t => ({
			...t,
			daysOpen: differenceInDays(now, new Date(t.createdAt)),
		})),
	});
});
