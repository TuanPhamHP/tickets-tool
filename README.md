# XC-Tickets

Hệ thống quản lý yêu cầu công việc (ticket) giữa **Xuân Cương** và **Công ty Cổ phần Giải pháp 8 Giờ**.

## Cài đặt

```bash
yarn install
```

## Chạy dev

```bash
yarn dev
```

## Database

```bash
yarn db:push      # Sync schema lên DB (dev only)
yarn db:studio    # Mở Drizzle Studio
```

## Seed dữ liệu mẫu

```bash
curl -X POST http://localhost:3000/api/seed
```

> Chỉ chạy được khi DB chưa có user nào, hoặc đăng nhập bằng tài khoản admin.

## Tài khoản mẫu

### Admin

| Email | Mật khẩu | Role |
|---|---|---|
| `admin@xuancuong.vn` | `Admin@123` | admin |

### Approver (Phê duyệt)

| Email | Mật khẩu | Phòng ban |
|---|---|---|
| `tgd@xuancuong.vn` | `User@123` | Ban Giám Đốc |

### Requester (Yêu cầu)

| Email | Mật khẩu | Phòng ban |
|---|---|---|
| `kd@xuancuong.vn` | `User@123` | Phòng Kinh Doanh |
| `ketoan@xuancuong.vn` | `User@123` | Phòng Kế Toán |
| `giaodich@xuancuong.vn` | `User@123` | Phòng Giao Dịch |
| `cskh@xuancuong.vn` | `User@123` | Phòng Chăm Sóc Khách Hàng |

### Implementer (Thực hiện)

| Email | Mật khẩu | Công ty |
|---|---|---|
| `dev@8gio.vn` | `User@123` | Công ty Cổ phần Giải pháp 8 Giờ |

## Luồng xử lý ticket

| Loại | Tên | Luồng |
|---|---|---|
| Type 1 | Xử lý vận hành | `draft → pending_review → approved → in_progress → completed → accepted` |
| Type 2 | Thay đổi & Tối ưu | `draft → pending_review → pending_approval → approved → in_progress → completed → accepted` |
| Type 3 | Trích xuất dữ liệu | (như type 2) |
| Type 4 | Phát triển tính năng | (như type 2) |

> Ticket có thể bị `cancelled` từ: `draft`, `pending_review`, `pending_approval`, `approved`, `rejected`.
> Ticket bị `rejected` có thể resubmit.

## Migrate DB (production)

```bash
yarn db:generate   # Tạo migration files từ schema
yarn db:push       # Áp dụng trực tiếp (dev only)
```
