import {
	mysqlTable,
	int,
	varchar,
	text,
	boolean,
	timestamp,
	float,
	mysqlEnum,
	index,
	uniqueIndex,
} from 'drizzle-orm/mysql-core';

// ─── DEPARTMENTS ────────────────────────────────────────────────────────────
export const departments = mysqlTable('departments', {
	id: int('id').autoincrement().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	company: varchar('company', { length: 255 }).notNull().default('Xuân Cương'),
	description: text('description'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// ─── USERS ──────────────────────────────────────────────────────────────────
/**
 * role:
 *   admin       - quản trị hệ thống
 *   requester   - Trưởng BP / Đầu mối Xuân Cương (bên yêu cầu)
 *   approver    - Tổng Giám Đốc / Ban Giám Đốc  (bên phê duyệt)
 *   implementer - Công ty Cổ phần Giải pháp 8 Giờ (bên thực hiện)
 */
export const users = mysqlTable(
	'users',
	{
		id: int('id').autoincrement().primaryKey(),
		name: varchar('name', { length: 255 }).notNull(),
		email: varchar('email', { length: 255 }).notNull(),
		passwordHash: varchar('password_hash', { length: 255 }).notNull(),
		role: mysqlEnum('role', ['admin', 'requester', 'approver', 'implementer']).notNull().default('requester'),
		departmentId: int('department_id').references(() => departments.id),
		company: varchar('company', { length: 255 }).default('Xuân Cương'),
		phone: varchar('phone', { length: 20 }),
		avatar: varchar('avatar', { length: 500 }),
		isActive: boolean('is_active').notNull().default(true),
		telegramId: varchar('telegram_id', { length: 255 }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
	},
	table => [
		uniqueIndex('users_email_idx').on(table.email),
	],
);

// ─── TICKETS ────────────────────────────────────────────────────────────────
/**
 * type:
 *   1 - Xử lý vận hành              → Sau review: tự động approved (không qua phê duyệt)
 *   2 - Thay đổi & Tối ưu           → Sau review: cần phê duyệt (pending_approval)
 *   3 - Trích xuất dữ liệu          → Sau review: cần phê duyệt (pending_approval)
 *   4 - Phát triển tính năng mới    → Sau review: cần phê duyệt (pending_approval)
 *
 * status flow:
 *   draft → pending_review → pending_approval → approved → in_progress → completed → accepted
 *                          ↗ (type 1: skip pending_approval, sang approved thẳng)
 *                                             ↘ rejected (→ có thể resubmit)
 *   cancelled: có thể huỷ từ draft, pending_review, pending_approval, approved, rejected
 */
export const tickets = mysqlTable(
	'tickets',
	{
		id: int('id').autoincrement().primaryKey(),
		code: varchar('code', { length: 30 }).notNull(),
		title: varchar('title', { length: 500 }).notNull(),
		description: text('description'),
		type: int('type').notNull(), // 1 | 2 | 3 | 4
		status: mysqlEnum('status', ['draft', 'pending_review', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'accepted', 'cancelled'])
			.notNull()
			.default('draft'),
		priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).notNull().default('medium'),

		// parties
		requesterId: int('requester_id').notNull().references(() => users.id),
		departmentId: int('department_id').references(() => departments.id),
		approverId: int('approver_id').references(() => users.id),
		implementerId: int('implementer_id').references(() => users.id),
		reviewerId: int('reviewer_id').references(() => users.id),

		// tech review & estimate (set by implementer at pending_review stage)
		estimateDays: float('estimate_days'),
		estimateCost: float('estimate_cost'), // chỉ approver/admin được xem
		estimateNote: text('estimate_note'),
		reviewedAt: timestamp('reviewed_at'),

		// approval (set by approver at pending_approval stage)
		approvalNote: text('approval_note'),
		approvedAt: timestamp('approved_at'),
		rejectedAt: timestamp('rejected_at'),
		rejectionReason: text('rejection_reason'),

		// implementation
		startedAt: timestamp('started_at'),
		completedAt: timestamp('completed_at'),
		implementationNote: text('implementation_note'),

		// acceptance
		acceptedAt: timestamp('accepted_at'),
		acceptanceNote: text('acceptance_note'),

		// cancel
		cancelledAt: timestamp('cancelled_at'),
		cancelReason: text('cancel_reason'),

		deadline: timestamp('deadline'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
	},
	table => [
		uniqueIndex('tickets_code_idx').on(table.code),
		index('tickets_requester_idx').on(table.requesterId),
		index('tickets_status_idx').on(table.status),
		index('tickets_type_idx').on(table.type),
	],
);

// ─── TICKET COMMENTS ────────────────────────────────────────────────────────
export const ticketComments = mysqlTable(
	'ticket_comments',
	{
		id: int('id').autoincrement().primaryKey(),
		ticketId: int('ticket_id').notNull().references(() => tickets.id),
		userId: int('user_id').notNull().references(() => users.id),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
	},
	table => [
		index('ticket_comments_ticket_idx').on(table.ticketId),
	],
);

// ─── TICKET ATTACHMENTS ─────────────────────────────────────────────────────
export const ticketAttachments = mysqlTable('ticket_attachments', {
	id: int('id').autoincrement().primaryKey(),
	ticketId: int('ticket_id').notNull().references(() => tickets.id),
	uploadedBy: int('uploaded_by').notNull().references(() => users.id),
	fileName: varchar('file_name', { length: 255 }).notNull(),
	fileUrl: varchar('file_url', { length: 1000 }).notNull(),
	fileSize: int('file_size'),
	mimeType: varchar('mime_type', { length: 100 }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── TICKET HISTORY ─────────────────────────────────────────────────────────
export const ticketHistory = mysqlTable(
	'ticket_history',
	{
		id: int('id').autoincrement().primaryKey(),
		ticketId: int('ticket_id').notNull().references(() => tickets.id),
		userId: int('user_id').notNull().references(() => users.id),
		action: varchar('action', { length: 50 }).notNull(),
		fromStatus: varchar('from_status', { length: 50 }),
		toStatus: varchar('to_status', { length: 50 }),
		note: text('note'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	table => [
		index('ticket_history_ticket_idx').on(table.ticketId),
	],
);


// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
export const notifications = mysqlTable(
	'notifications',
	{
		id: int('id').autoincrement().primaryKey(),
		userId: int('user_id').notNull().references(() => users.id),
		actorId: int('actor_id').references(() => users.id),
		type: varchar('type', { length: 50 }).notNull(),
		ticketId: int('ticket_id').references(() => tickets.id),
		message: varchar('message', { length: 500 }).notNull(),
		isRead: boolean('is_read').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	table => [
		index('notifications_user_idx').on(table.userId),
		index('notifications_read_idx').on(table.isRead),
	],
);

// ─── TYPE EXPORTS ────────────────────────────────────────────────────────────
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketComment = typeof ticketComments.$inferSelect;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type TicketHistory = typeof ticketHistory.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
