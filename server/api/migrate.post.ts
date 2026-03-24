/**
 * Migration endpoint — chạy một lần để cập nhật schema tickets theo luồng mới.
 * XÓA FILE NÀY SAU KHI CHẠY THÀNH CÔNG.
 *
 * POST /api/migrate
 */
export default defineEventHandler(async () => {
	const db = useDB();
	const client = (db as any).session.client;

	const steps: Array<{ name: string; sql: string }> = [
		{
			name: 'Tắt FK check',
			sql: 'SET FOREIGN_KEY_CHECKS = 0',
		},
		{
			name: 'Đổi enum status (thêm pending_review)',
			sql: `ALTER TABLE tickets MODIFY COLUMN status ENUM('draft','pending_review','pending_approval','approved','rejected','in_progress','completed','accepted','cancelled') NOT NULL DEFAULT 'draft'`,
		},
		{
			name: 'Xóa cột estimate_hours',
			sql: 'ALTER TABLE tickets DROP COLUMN IF EXISTS estimate_hours',
		},
		{
			name: 'Xóa cột estimated_at',
			sql: 'ALTER TABLE tickets DROP COLUMN IF EXISTS estimated_at',
		},
		{
			name: 'Thêm cột reviewer_id',
			sql: 'ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reviewer_id INT NULL',
		},
		{
			name: 'Thêm cột estimate_days',
			sql: 'ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimate_days FLOAT NULL',
		},
		{
			name: 'Thêm cột estimate_cost',
			sql: 'ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimate_cost FLOAT NULL',
		},
		{
			name: 'Thêm cột reviewed_at',
			sql: 'ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL',
		},
		{
			name: 'Bật FK check lại',
			sql: 'SET FOREIGN_KEY_CHECKS = 1',
		},
	];

	const results: Array<{ name: string; status: string; error?: string }> = [];

	for (const step of steps) {
		try {
			await client.promise().query(step.sql);
			results.push({ name: step.name, status: 'ok' });
		}
		catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			// Bỏ qua lỗi "column already exists" hoặc "column không tồn tại"
			if (msg.includes('Duplicate column') || msg.includes("Can't DROP") || msg.includes('check that column')) {
				results.push({ name: step.name, status: 'skipped', error: msg });
			}
			else {
				// Đảm bảo FK được bật lại dù có lỗi
				try { await client.promise().query('SET FOREIGN_KEY_CHECKS = 1'); } catch {}
				return { success: false, failedAt: step.name, error: msg, results };
			}
		}
	}

	return { success: true, message: 'Migration hoàn thành. Hãy xóa file server/api/migrate.post.ts.', results };
});
