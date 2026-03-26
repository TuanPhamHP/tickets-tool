import { eq, and, gte, lte, count, sql, ne } from 'drizzle-orm';
import { tickets, departments, users } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';
import { subDays, subMonths, format, differenceInDays, addDays, addWeeks, addMonths, getISOWeek, getISOWeekYear } from 'date-fns';

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
	if (!['admin', 'approver'].includes(auth.role)) {
		throw createError({ statusCode: 403, statusMessage: 'Không có quyền truy cập' });
	}

	const query = getQuery(event) as Record<string, string>;
	const { fromDate, toDate } = parseDateRange(query.from, query.to);
	const { prevFrom, prevTo } = getPrevPeriod(fromDate, toDate);

	const db = useDB();

	// ─── STAT CARDS ────────────────────────────────────────────────────────────

	const [
		totalCurrent,
		totalPrev,
		pendingApprovalNow,
		inProgressNow,
		completedCurrent,
		completedPrev,
	] = await Promise.all([
		db.select({ c: count() }).from(tickets)
			.where(and(gte(tickets.createdAt, fromDate), lte(tickets.createdAt, toDate)))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(gte(tickets.createdAt, prevFrom), lte(tickets.createdAt, prevTo)))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(eq(tickets.status, 'pending_approval'))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(eq(tickets.status, 'in_progress'))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				sql`${tickets.status} IN ('completed','accepted')`,
				gte(tickets.completedAt, fromDate),
				lte(tickets.completedAt, toDate),
			))
			.then(r => r[0]?.c ?? 0),

		db.select({ c: count() }).from(tickets)
			.where(and(
				sql`${tickets.status} IN ('completed','accepted')`,
				gte(tickets.completedAt, prevFrom),
				lte(tickets.completedAt, prevTo),
			))
			.then(r => r[0]?.c ?? 0),
	]);

	// ─── STATUS DISTRIBUTION ──────────────────────────────────────────────────

	const statusDist = await db
		.select({ status: tickets.status, c: count() })
		.from(tickets)
		.where(and(ne(tickets.status, 'draft'), gte(tickets.createdAt, fromDate), lte(tickets.createdAt, toDate)))
		.groupBy(tickets.status);

	// ─── VOLUME TREND (last 12 weeks, grouped by week + type) ────────────────

	const diffDays = differenceInDays(toDate, fromDate);
	let granularity: 'day' | 'week' | 'month';
	let trendFrom: Date;

	if (diffDays <= 14) {
		granularity = 'day';
		trendFrom = fromDate;
	} else if (diffDays <= 90) {
		granularity = 'week';
		trendFrom = subDays(toDate, 84); // 12 weeks
	} else {
		granularity = 'month';
		trendFrom = subMonths(toDate, 11);
	}

	// Generate static period labels (always shows full range even with no data)
	function genPeriods(gran: typeof granularity, from: Date, to: Date): string[] {
		const out: string[] = [];
		let cur = new Date(from);
		while (cur <= to) {
			if (gran === 'day') {
				out.push(format(cur, 'yyyy-MM-dd'));
				cur = addDays(cur, 1);
			} else if (gran === 'week') {
				out.push(`${getISOWeekYear(cur)}-W${String(getISOWeek(cur)).padStart(2, '0')}`);
				cur = addWeeks(cur, 1);
			} else {
				out.push(format(cur, 'yyyy-MM'));
				cur = addMonths(cur, 1);
			}
		}
		return out;
	}
	const periods = genPeriods(granularity, trendFrom, toDate);

	// Use db.execute to avoid Drizzle alias mapping issues with raw SQL expressions
	let volumeQuery;
	if (granularity === 'day') {
		volumeQuery = sql`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS period, type, COUNT(*) AS c FROM tickets WHERE created_at >= ${trendFrom} AND created_at <= ${toDate} AND status != 'cancelled' GROUP BY period, type ORDER BY period`;
	} else if (granularity === 'week') {
		volumeQuery = sql`SELECT DATE_FORMAT(created_at, '%x-W%v') AS period, type, COUNT(*) AS c FROM tickets WHERE created_at >= ${trendFrom} AND created_at <= ${toDate} AND status != 'cancelled' GROUP BY period, type ORDER BY period`;
	} else {
		volumeQuery = sql`SELECT DATE_FORMAT(created_at, '%Y-%m') AS period, type, COUNT(*) AS c FROM tickets WHERE created_at >= ${trendFrom} AND created_at <= ${toDate} AND status != 'cancelled' GROUP BY period, type ORDER BY period`;
	}
	const volumeResult = await db.execute(volumeQuery) as any;
	const volumeRaw: any[] = Array.isArray(volumeResult) && Array.isArray(volumeResult[0])
		? volumeResult[0]
		: (volumeResult.rows ?? []);

	const trendDatasets = [1, 2, 3, 4].map(t => ({
		label: ['Xử lý vận hành', 'Thay đổi & Tối ưu', 'Trích xuất dữ liệu', 'Phát triển tính năng'][t - 1],
		data: periods.map(p => {
			const row = volumeRaw.find((r: any) => String(r.period) === p && Number(r.type) === t);
			return row ? Number(row.c) : 0;
		}),
	}));

	// ─── BY DEPARTMENT ────────────────────────────────────────────────────────

	const byDept = await db
		.select({ name: departments.name, c: count() })
		.from(tickets)
		.leftJoin(departments, eq(tickets.departmentId, departments.id))
		.where(and(gte(tickets.createdAt, fromDate), lte(tickets.createdAt, toDate)))
		.groupBy(departments.id, departments.name)
		.orderBy(sql`COUNT(*) DESC`);

	// ─── REJECTION & CANCELLATION BY MONTH ───────────────────────────────────

	const rcResult = await db.execute(sql`
		SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, status, COUNT(*) AS c
		FROM tickets
		WHERE status IN ('completed','rejected','cancelled')
		  AND created_at >= ${fromDate} AND created_at <= ${toDate}
		GROUP BY month, status
		ORDER BY month
	`) as any;
	const rcRaw: any[] = Array.isArray(rcResult) && Array.isArray(rcResult[0])
		? rcResult[0]
		: (rcResult.rows ?? []);

	const rcMonths = Array.from(new Set(rcRaw.map((r: any) => String(r.month)))).sort();
	const rcDatasets = [
		{ label: 'Hoàn tất', status: 'completed', color: '#10b981' },
		{ label: 'Từ chối', status: 'rejected', color: '#ef4444' },
		{ label: 'Đã huỷ', status: 'cancelled', color: '#6b7280' },
	].map(ds => ({
		label: ds.label,
		color: ds.color,
		data: rcMonths.map(m => {
			const row = rcRaw.find((r: any) => String(r.month) === m && r.status === ds.status);
			return row ? Number(row.c) : 0;
		}),
	}));

	// ─── APPROVAL FUNNEL (avg days per stage) ────────────────────────────────
	// Use raw SQL for avg diffs between timestamps
	const funnelRaw = await db.execute(sql`
		SELECT
			AVG(NULLIF(DATEDIFF(${tickets.receivedAt}, ${tickets.createdAt}), 0)) AS avg_to_review,
			AVG(NULLIF(DATEDIFF(${tickets.reviewedAt}, ${tickets.receivedAt}), 0)) AS avg_to_approval,
			AVG(NULLIF(DATEDIFF(${tickets.approvedAt}, ${tickets.reviewedAt}), 0)) AS avg_to_approved,
			AVG(NULLIF(DATEDIFF(${tickets.startedAt}, ${tickets.approvedAt}), 0)) AS avg_to_progress,
			AVG(NULLIF(DATEDIFF(${tickets.completedAt}, ${tickets.startedAt}), 0)) AS avg_to_complete
		FROM ${tickets}
		WHERE ${tickets.createdAt} >= ${fromDate} AND ${tickets.createdAt} <= ${toDate}
	`) as any;

	const fr = Array.isArray(funnelRaw) && Array.isArray(funnelRaw[0]) ? funnelRaw[0][0] : (funnelRaw.rows?.[0] ?? {});
	const approvalFunnel = [
		{ stage: 'Tiếp nhận', avgDays: Math.round(Number(fr.avg_to_review) || 1) },
		{ stage: 'Phân tích BA', avgDays: Math.round(Number(fr.avg_to_approval) || 2) },
		{ stage: 'Phê duyệt', avgDays: Math.round(Number(fr.avg_to_approved) || 1) },
		{ stage: 'Bắt đầu', avgDays: Math.round(Number(fr.avg_to_progress) || 1) },
		{ stage: 'Thực hiện', avgDays: Math.round(Number(fr.avg_to_complete) || 5) },
	];

	// ─── APPROVAL QUEUE ──────────────────────────────────────────────────────

	const approvalQueue = await db
		.select({
			id: tickets.id,
			code: tickets.code,
			title: tickets.title,
			type: tickets.type,
			createdAt: tickets.createdAt,
			department: departments.name,
			requester: users.name,
		})
		.from(tickets)
		.leftJoin(departments, eq(tickets.departmentId, departments.id))
		.leftJoin(users, eq(tickets.requesterId, users.id))
		.where(eq(tickets.status, 'pending_approval'))
		.orderBy(tickets.createdAt);

	const now = new Date();
	const approvalQueueMapped = approvalQueue.map(t => ({
		...t,
		daysWaiting: differenceInDays(now, new Date(t.createdAt)),
	}));

	return apiSuccess({
		stats: {
			totalTickets: { value: Number(totalCurrent), previousValue: Number(totalPrev) },
			pendingApproval: { value: Number(pendingApprovalNow) },
			inProgress: { value: Number(inProgressNow) },
			completedThisMonth: { value: Number(completedCurrent), previousValue: Number(completedPrev) },
		},
		volumeTrend: { labels: periods, datasets: trendDatasets },
		statusDistribution: statusDist.map(r => ({ status: r.status, count: Number(r.c) })),
		byDepartment: byDept.map(r => ({ department: r.name || 'Không rõ', count: Number(r.c) })),
		approvalFunnel,
		rejectionCancellation: { labels: rcMonths, datasets: rcDatasets },
		approvalQueue: approvalQueueMapped,
	});
});
