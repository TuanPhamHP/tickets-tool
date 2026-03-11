# bai-xe-83

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Cấu trúc server hoàn chỉnh

server/ database/ schema.ts ← Drizzle schema: 6 bảng SQLite utils/ db.ts ← Kết nối DB + auto-migrate + generateTicketCode() auth.ts ← JWT sign/verify, requireAuth(), requireRole() response.ts ← apiSuccess(), apiPaginated(), getPagination() middleware/ auth.ts ← Populate event.context.user từ JWT api/ auth/ login · logout · me · change-password tickets/ CRUD + 7 workflow actions + comments departments/ CRUD users/ CRUD stats/ Dashboard counts seed.post.ts ← Seed dữ liệu mẫu REST API Endpoints Endpoint Mô tả POST /api/auth/login Đăng nhập, trả JWT GET /api/auth/me Thông tin user hiện tại POST /api/tickets Tạo yêu cầu mới GET /api/tickets Danh sách (filter by role tự động) POST /api/tickets/:id/submit Nộp yêu cầu POST /api/tickets/:id/approve Phê duyệt (approver) POST /api/tickets/:id/reject Từ chối (approver) POST /api/tickets/:id/estimate Báo estimate (implementer) POST /api/tickets/:id/start Bắt đầu thực hiện POST /api/tickets/:id/complete Hoàn tất bàn giao POST /api/tickets/:id/accept Nghiệm thu (requester) GET /api/stats Thống kê dashboard Để chạy

# Dev server

yarn dev

# Seed dữ liệu mẫu (POST lần đầu)

curl -X POST http://localhost:3000/api/seed

# Tài khoản mẫu

# admin@xuancuong.vn / Admin@123

# tgd@xuancuong.vn / User@123 (approver)

# kd@xuancuong.vn / User@123 (requester)

# dev@8gio.vn / User@123 (implementer)

Luồng quy trình theo diagram Type 1 (Hỗ trợ vận hành): draft → approved (tự động, không cần phê duyệt) → in_progress → completed → accepted Type 2, 3: draft → pending_approval → approved/rejected → in_progress → completed → accepted

## Migrate db

```bash
yarn db:push
```
