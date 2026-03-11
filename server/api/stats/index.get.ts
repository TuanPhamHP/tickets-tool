import { eq, count, and, sql } from 'drizzle-orm';
import { tickets } from '../../database/schema';
import { requireAuth } from '../../utils/auth';
import { apiSuccess } from '../../utils/response';

export default defineEventHandler(async (event) => {
	const auth = await requireAuth(event);
	const db = useDB();

	const baseCondition = auth.role === 'requester'
		? eq(tickets.requesterId, Number(auth.sub))
		: auth.role === 'implementer'
			? sql`${tickets.implementerId} = ${Number(auth.sub)} OR ${tickets.status} IN ('approved','in_progress','completed','accepted')`
			: undefined;

	const [
		total,
		draft,
		pendingApproval,
		approved,
		inProgress,
		completed,
		accepted,
		rejected,
		cancelled,
		type1,
		type2,
		type3,
	] = await Promise.all([
		db.select({ count: count() }).from(tickets).where(baseCondition).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'draft'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'pending_approval'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'approved'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'in_progress'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'completed'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'accepted'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'rejected'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.status, 'cancelled'))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.type, 1))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.type, 2))).then(r => r[0]),
		db.select({ count: count() }).from(tickets).where(and(baseCondition, eq(tickets.type, 3))).then(r => r[0]),
	]);

	return apiSuccess({
		total: total?.count ?? 0,
		byStatus: {
			draft: draft?.count ?? 0,
			pendingApproval: pendingApproval?.count ?? 0,
			approved: approved?.count ?? 0,
			inProgress: inProgress?.count ?? 0,
			completed: completed?.count ?? 0,
			accepted: accepted?.count ?? 0,
			rejected: rejected?.count ?? 0,
			cancelled: cancelled?.count ?? 0,
		},
		byType: {
			operationalSupport: type1?.count ?? 0,   // Hỗ trợ vận hành
			changeOptimize: type2?.count ?? 0,        // Thay đổi & Tối ưu
			newDevelopment: type3?.count ?? 0,        // Phát triển mới
		},
	});
});
