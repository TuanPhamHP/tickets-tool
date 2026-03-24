# Database & Migrations (Drizzle ORM)

## Quy tắc tuyệt đối

**KHÔNG BAO GIỜ** chạy các lệnh sau trừ khi được dev xác nhận rõ ràng bằng văn bản:

```bash
# ❌ CẤM TUYỆT ĐỐI — xoá toàn bộ data
drizzle-kit drop
drizzle-kit push   # ghi đè schema trực tiếp, không tạo migration file

# ❌ CẤM — tương đương db:reset
db:reset
db:seed (nếu chưa có migration)
```

---

## Workflow đúng khi thay đổi schema

Mọi thay đổi schema đều phải đi qua migration file. Không có ngoại lệ.

### Bước 1 — Sửa schema file

```ts
// db/schema/booking.ts
export const bookings = pgTable('bookings', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	// Thêm cột mới ở đây
	status: varchar('status', { length: 50 }).notNull().default('pending'),
});
```

### Bước 2 — Generate migration file

```bash
yarn drizzle-kit generate
```

Lệnh này tạo file mới trong `drizzle/` (hoặc thư mục migrations đã config), ví dụ:

```
drizzle/
└── 0003_add_booking_status.sql
```

**Kiểm tra file SQL vừa tạo trước khi chạy** — đảm bảo đúng ý định.

### Bước 3 — Chạy migration

```bash
yarn drizzle-kit migrate
```

---

## Khi nào dùng `drizzle-kit push`

`push` chỉ dùng cho **local dev database** khi đang prototype schema và chưa cần lịch sử migration. Không bao giờ dùng `push` cho staging hoặc production.

| Môi trường           | Lệnh cho phép                                |
| -------------------- | -------------------------------------------- |
| Local (prototype)    | `push` hoặc `generate` + `migrate`           |
| Local (có data thật) | `generate` + `migrate`                       |
| Staging              | `generate` + `migrate`                       |
| Production           | `generate` + `migrate` — review kỹ SQL trước |

---

## Đặt tên migration file

Drizzle tự đánh số thứ tự. Thêm tên mô tả rõ ràng khi generate:

```bash
# Drizzle tự generate tên từ thay đổi detect được
# Nếu cần đặt tên custom, đổi tên file sau khi generate — KHÔNG sửa nội dung SQL
```

Format tên chuẩn: `{number}_{action}_{subject}.sql`

```
0001_create_bookings.sql
0002_add_user_id_to_bookings.sql
0003_add_booking_status.sql
```

---

## Không bao giờ sửa migration file đã chạy

```
❌ Sửa 0002_add_user_id_to_bookings.sql sau khi đã migrate
✅ Tạo migration mới 0004_fix_user_id_constraint.sql
```

Migration đã chạy = lịch sử bất biến. Sửa file cũ gây mất đồng bộ giữa các môi trường.

---

## Checklist trước khi migrate

- [ ] Đã review nội dung file SQL vừa generate chưa?
- [ ] Migration có destructive operation không? (`DROP COLUMN`, `DROP TABLE`, `TRUNCATE`)
- [ ] Nếu có destructive → đã backup data chưa?
- [ ] Đang migrate môi trường nào? (local / staging / production)
