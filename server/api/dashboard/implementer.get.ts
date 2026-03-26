import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { tickets, departments, users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';
import { subDays, differenceInDays } from 'date-fns';

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
	if (!['admin', 'implementer'].includes(auth.role)) {
		throw createError({ statusCode: 403, statusMessage: 'Không có quyền truy cập' });
	}

	const query = getQuery(event) as Record<string, string>;
	const { fromDate, toDate } = parseDateRange(query.from, query.to);
	const { prevFrom, prevTo } = getPrevPeriod(fromDate, toDate);

	const db = useDB();

	// ─── STAT CARDS ────────────────────────────────────────────────────────────

	const [activeWorkload, incomingQueue, pendingAcceptance, deliveredCurrent, deliveredPrev] = await Promise.all([
		db.select({ c: count() }).from(tickets)
			.where(eq(tickets.status, 'in_progress'))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(eq(tickets.status, 'approved'))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(eq(tickets.status, 'completed'))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				eq(tickets.status, 'completed'),
				gte(tickets.completedAt, fromDate),
				lte(tickets.completedAt, toDate),
			))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				eq(tickets.status, 'completed'),
				gte(tickets.completedAt, prevFrom),
				lte(tickets.completedAt, prevTo),
			))
			.then(r => r[0]?.c ?? 0),
	]);

	// ─── WORKLOAD BY TYPE ────────────────────────────────────────────────────

	const workloadByType = await db
		.select({ type: tickets.type, c: count() })
		.from(tickets)
		.where(eq(tickets.status, 'in_progress'))
		.groupBy(tickets.type);

	// ─── WEEKLY THROUGHPUT (last 8 weeks) ────────────────────────────────────

	const throughputRaw = await db
		.select({
			week: sql`DATE_FORMAT(${tickets.completedAt}, '%x-W%v')`.as('week'),
			c: count(),
		})
		.from(tickets)
		.where(and(
			sql`${tickets.status} IN ('completed','accepted')`,
			gte(tickets.completedAt, subDays(toDate, 56)),
			lte(tickets.completedAt, toDate),
		))
		.groupBy(sql`DATE_FORMAT(${tickets.completedAt}, '%x-W%v')`)
		.orderBy(sql`DATE_FORMAT(${tickets.completedAt}, '%x-W%v')`);

	// ─── CYCLE TIME BY TYPE ─────────────────────────────────────────────────

	const cycleRaw = await db.execute(sql`
		SELECT
			type,
			AVG(DATEDIFF(${tickets.completedAt}, ${tickets.startedAt})) AS avg_days
		FROM ${tickets}
		WHERE ${tickets.status} IN ('completed', 'accepted')
			AND ${tickets.completedAt} IS NOT NULL
			AND ${tickets.startedAt} IS NOT NULL
			AND ${tickets.completedAt} >= ${fromDate}
			AND ${tickets.completedAt} <= ${toDate}
		GROUP BY type
	`) as any;

	const cycleRows = Array.isArray(cycleRaw) && Array.isArray(cycleRaw[0])
		? cycleRaw[0]
		: (cycleRaw.rows ?? []);

	// ─── STATUS PIPELINE ─────────────────────────────────────────────────────

	const pipelineStatuses = ['approved', 'in_progress', 'completed', 'accepted'] as const;
	const pipelineRaw = await db
		.select({ status: tickets.status, c: count() })
		.from(tickets)
		.where(sql`${tickets.status} IN ('approved','in_progress','completed','accepted')`)
		.groupBy(tickets.status);

	// ─── CURRENT WORKLOAD TABLE ─────────────────────────────────────────────

	const workloadTable = await db
		.select({
			id: tickets.id,
			code: tickets.code,
			title: tickets.title,
			type: tickets.type,
			status: tickets.status,
			startedAt: tickets.startedAt,
			department: departments.name,
			requester: users.name,
		})
		.from(tickets)
		.leftJoin(departments, eq(tickets.departmentId, departments.id))
		.leftJoin(users, eq(tickets.requesterId, users.id))
		.where(sql`${tickets.status} IN ('approved','in_progress','completed')`)
		.orderBy(sql`FIELD(${tickets.status},'in_progress','approved','completed'), ${tickets.startedAt} ASC`);

	const now = new Date();

	return apiSuccess({
		stats: {
			activeWorkload: { value: Number(activeWorkload) },
			incomingQueue: { value: Number(incomingQueue) },
			pendingAcceptance: { value: Number(pendingAcceptance) },
			deliveredThisMonth: { value: Number(deliveredCurrent), previousValue: Number(deliveredPrev) },
		},
		workloadByType: [1, 2, 3, 4].map(t => {
			const row = workloadByType.find(r => r.type === t);
			return { type: t, count: row ? Number(row.c) : 0 };
		}),
		weeklyThroughput: {
			labels: throughputRaw.map((r: any) => String(r.week)),
			data: throughputRaw.map((r: any) => Number(r.c)),
		},
		cycleTimeByType: [1, 2, 3, 4].map(t => {
			const row = cycleRows.find((r: any) => Number(r.type) === t);
			return { type: t, avgDays: row ? Math.round(Number(row.avg_days) || 0) : 0 };
		}),
		statusPipeline: pipelineStatuses.map(s => {
			const row = pipelineRaw.find(r => r.status === s);
			return { status: s, count: row ? Number(row.c) : 0 };
		}),
		workloadTable: workloadTable.map(t => ({
			...t,
			daysInProgress: t.startedAt ? differenceInDays(now, new Date(t.startedAt)) : null,
		})),
	});
});
