import { inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users, departments, tickets } from '../database/schema';
import { requireAuth, requireRole } from '../utils/auth';
import { apiSuccess } from '../utils/response';

/**
 * Seed initial data – chỉ chạy 1 lần lúc setup.
 * Chỉ admin mới có thể chạy, hoặc không có user nào trong DB.
 */
export default defineEventHandler(async event => {
	const db = useDB();

	// Allow seeding only if no users exist, or caller is admin
	const existingUsers = await db.select({ id: users.id }).from(users).limit(1);

	if (existingUsers.length > 0) {
		const auth = await requireAuth(event);
		requireRole(auth, 'admin');
	}

	// Seed departments
	const deptData = [
		{ name: 'Ban Giám Đốc', company: 'Xuân Cương' },
		{ name: 'Phòng Kinh Doanh', company: 'Xuân Cương' },
		{ name: 'Phòng Kế Toán', company: 'Xuân Cương' },
		{ name: 'Phòng Kho', company: 'Xuân Cương' },
		{ name: 'Phòng IT', company: 'Xuân Cương' },
		{ name: 'Phòng Nhân Sự', company: 'Xuân Cương' },
		{ name: 'Trung tâm công nghệ', company: 'Công ty Cổ phần Giải pháp 8 Giờ' },
	];

	const deptNames = deptData.map(d => d.name);
	await db.insert(departments).values(deptData);
	const insertedDepts = await db.select().from(departments).where(inArray(departments.name, deptNames));

	const bgdDept = insertedDepts.find(d => d.name === 'Ban Giám Đốc')!;
	const itDept = insertedDepts.find(d => d.name === 'Phòng IT')!;
	const devDept = insertedDepts.find(d => d.name === 'Dev Team')!;
	const kdDept = insertedDepts.find(d => d.name === 'Phòng Kinh Doanh')!;

	// Seed users
	const hashedAdmin = await bcrypt.hash('Admin@123', 12);
	const hashedUser = await bcrypt.hash('User@123', 12);

	const userData = [
		{
			name: 'Admin Hệ Thống',
			email: 'admin@xuancuong.vn',
			passwordHash: hashedAdmin,
			role: 'admin' as const,
			departmentId: itDept.id,
			company: 'Xuân Cương',
			phone: '0901000001',
		},
		{
			name: 'Tổng Giám Đốc',
			email: 'tgd@xuancuong.vn',
			passwordHash: hashedUser,
			role: 'approver' as const,
			departmentId: bgdDept.id,
			company: 'Xuân Cương',
			phone: '0901000002',
		},
		{
			name: 'Trưởng Phòng Kinh Doanh',
			email: 'kd@xuancuong.vn',
			passwordHash: hashedUser,
			role: 'requester' as const,
			departmentId: kdDept.id,
			company: 'Xuân Cương',
			phone: '0901000003',
		},
		{
			name: 'Phòng công nghệ',
			email: 'dev@8gio.vn',
			passwordHash: hashedUser,
			role: 'implementer' as const,
			departmentId: devDept.id,
			company: 'Công ty Cổ phần Giải pháp 8 Giờ',
			phone: '0901000004',
		},
	];

	const userEmails = userData.map(u => u.email);
	await db.insert(users).values(userData);
	const insertedUsers = await db.select().from(users).where(inArray(users.email, userEmails));

	// const requester = insertedUsers.find(u => u.role === 'requester')!;

	// Seed sample tickets
	// const ticketData = [
	// 	{
	// 		code: 'XC-2025-0001',
	// 		title: 'Reset mật khẩu tài khoản nhân viên Kho A',
	// 		description: 'Nhân viên Kho A quên mật khẩu đăng nhập hệ thống, cần reset lại.',
	// 		type: 1,
	// 		status: 'approved' as const,
	// 		priority: 'high' as const,
	// 		requesterId: requester.id,
	// 		departmentId: kdDept.id,
	// 	},
	// 	{
	// 		code: 'XC-2025-0002',
	// 		title: 'Thêm cột "Chiết khấu" vào báo cáo doanh số tháng',
	// 		description: 'Báo cáo doanh số tháng hiện tại chưa có cột chiết khấu theo từng đơn hàng. Đề xuất bổ sung.',
	// 		type: 2,
	// 		status: 'pending_approval' as const,
	// 		priority: 'medium' as const,
	// 		requesterId: requester.id,
	// 		departmentId: kdDept.id,
	// 	},
	// 	{
	// 		code: 'XC-2025-0003',
	// 		title: 'Xây dựng module quản lý KPI nhân viên',
	// 		description: 'Mở rộng hệ thống để hỗ trợ theo dõi và đánh giá KPI nhân viên theo tháng/quý.',
	// 		type: 3,
	// 		status: 'draft' as const,
	// 		priority: 'low' as const,
	// 		requesterId: requester.id,
	// 		departmentId: kdDept.id,
	// 	},
	// ];

	// await db.insert(tickets).values(ticketData);

	// return apiSuccess({
	// 	departments: insertedDepts.length,
	// 	users: insertedUsers.map(u => ({ id: u.id, email: u.email, role: u.role })),
	// 	tickets: ticketData.length,
	// }, 'Seed dữ liệu mẫu thành công');
});
