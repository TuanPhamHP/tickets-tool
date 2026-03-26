## Business Context

XC-Tickets là hệ thống quản lý yêu cầu công việc (ticket) giữa **Xuân Cương** (bên yêu cầu) và **Công ty Cổ phần Giải pháp 8 Giờ** (bên thực hiện). TGĐ/BGĐ Xuân Cương phê duyệt các ticket loại 2, 3 và 4 trước khi triển khai.

## Tech Stack

- **Framework:** Nuxt 4
- **Language:** TypeScript
- **Styling:** Tailwind CSS — @docs/conventions.md#tailwind
- **State Management:** Pinia
- **Package Manager:** Yarn

## Project Structure

```
xc-tickets/
├── .claude/                  # Claude project config & instructions
├── assets/                   # Static assets (images, fonts, global styles)
├── components/               # Vue components (auto-imported)
├── composable/               # Vue composables / reusable logic (auto-imported)
├── layouts/                  # Nuxt layout components
├── middleware/               # Client-side route middleware (auth guards)
├── models/                   # Shared domain types / DTOs
├── pages/                    # File-based routing
│   ├── admin/                #   Admin-only pages
│   ├── tickets/              #   Ticket pages (list, detail, create)
│   ├── index.vue             #   Homepage / redirect
│   └── login.vue             #   Authentication page
├── public/                   # Publicly served static files
├── server/                   # Nitro server (runs on Node, not in browser)
│   ├── api/                  #   REST API handlers → accessible at /api/*
│   │   ├── auth/             #     Login, logout, session
│   │   ├── departments/      #     Department CRUD
│   │   ├── notifications/    #     Notification read/list
│   │   ├── stats/            #     Dashboard statistics
│   │   ├── tickets/          #     Ticket CRUD + status transitions
│   │   └── users/            #     User management
│   ├── database/
│   │   └── schema.ts         #     Drizzle ORM schema (single source of truth)
│   ├── middleware/
│   │   └── auth.ts           #     Server-side auth middleware (JWT/session verify)
│   ├── utils/                #     Server-only helpers (db client, etc.)
│   └── seed.post.ts          #     Database seeding endpoint (POST /api/seed)
├── services/                 # Client-side API call wrappers
├── store/                    # Pinia stores (global state)
├── types/                    # Global TypeScript type definitions
├── utils/                    # Shared utility functions (auto-imported)
├── app.vue                   # Root Vue component
├── drizzle.config.ts         # Drizzle config (DB connection, migration path)
├── nuxt.config.ts            # Nuxt config (modules, runtimeConfig, etc.)
├── Dockerfile                # Container build definition
└── start.sh                  # Server start script
```

## Database Schema

Managed by **Drizzle ORM** (`server/database/schema.ts`). MySQL dialect.

### Tables

| Table                | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `departments`        | Phòng ban thuộc công ty Xuân Cương                                            |
| `users`              | Tài khoản hệ thống — 4 roles: `admin`, `requester`, `approver`, `implementer` |
| `tickets`            | Yêu cầu công việc — core entity                                               |
| `ticket_comments`    | Bình luận trên ticket                                                         |
| `ticket_attachments` | File đính kèm của ticket                                                      |
| `ticket_history`     | Audit log mọi thay đổi trạng thái                                             |
| `notifications`      | Thông báo gửi đến user                                                        |

### Ticket Types

| Type | Name                            | Cần phê duyệt? |
| ---- | ------------------------------- | -------------- |
| `1`  | Xử lý vận hành                  | Không          |
| `2`  | Thay đổi & Tối ưu               | Có             |
| `3`  | Trích xuất dữ liệu (xây module) | Có             |
| `4`  | Phát triển tính năng mới        | Có             |

### Ticket Status Flow

```
draft → pending_review → pending_approval → approved → in_progress → completed → accepted
        (tech review)    (phó tổng duyệt)                          ↘ rejected (→ resubmit)
             ↘ type 1: bỏ qua pending_approval, sang approved thẳng
cancelled: có thể từ draft, pending_review, pending_approval, approved, rejected
```

### User Roles

| Role          | Actor                           | Quyền chính                             |
| ------------- | ------------------------------- | --------------------------------------- |
| `admin`       | Quản trị hệ thống               | Full access                             |
| `requester`   | Trưởng BP / Đầu mối Xuân Cương  | Tạo ticket, nghiệm thu                  |
| `approver`    | TGĐ / Ban Giám Đốc              | Phê duyệt / từ chối ticket type 2, 3, 4 |
| `implementer` | Công ty Cổ phần Giải pháp 8 Giờ | Xử lý, cập nhật tiến độ                 |

## Environment Variables

Defined in `.env` (see `.env.example` for template).

### Frontend / Public (`NUXT_PUBLIC_*`)

Exposed to client-side — do NOT put secrets here.

| Variable                   | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | Base URL của Nuxt app (mặc định `http://localhost:3000`) |
| `NUXT_PUBLIC_KZ_TEK_URL`   | URL service KzTek (tích hợp bên ngoài)                   |
| `NUXT_PUBLIC_X_API_KEY`    | API key gọi service ngoài                                |
| `NUXT_PUBLIC_MINIO_URL`    | URL MinIO object storage (lưu file đính kèm)             |

### Server / Nitro (`NUXT_*`)

Server-only — không bao giờ expose ra client.

| Variable           | Description                         |
| ------------------ | ----------------------------------- |
| `NUXT_JWT_SECRET`  | Secret key để sign/verify JWT token |
| `NUXT_DB_HOST`     | MySQL host                          |
| `NUXT_DB_PORT`     | MySQL port (mặc định `3306`)        |
| `NUXT_DB_USER`     | MySQL username                      |
| `NUXT_DB_PASSWORD` | MySQL password                      |
| `NUXT_DB_NAME`     | MySQL database name (`xc_tickets`)  |

## Common Commands

```bash
# Dev
yarn dev              # Start dev server
yarn build            # Build for production
yarn preview          # Preview production build

# Database (Drizzle)
yarn db:generate      # Generate migration files từ schema changes
yarn db:push          # Push schema trực tiếp lên DB (dev only, không tạo migration)
yarn db:migrate          # migrate
yarn db:studio        # Mở Drizzle Studio — GUI xem/edit data
```

## Non-Negotiable Rules

Những rule này LUÔN áp dụng, không có ngoại lệ:

### Database — TUYỆT ĐỐI KHÔNG VI PHẠM

- KHÔNG chạy drizzle-kit push, db:reset, hoặc bất kỳ lệnh nào xoá/ghi đè schema trực tiếp
- Mọi thay đổi schema phải qua migration file: sửa schema → yarn drizzle-kit generate → review SQL → yarn drizzle-kit migrate
- Không sửa migration file đã chạy — tạo migration mới nếu cần fix
- Nếu task yêu cầu thay đổi schema mà không rõ ràng → dừng lại và hỏi dev trước khi làm
- Xem chi tiết: @docs/database.md

### Vue / Nuxt

- Luôn dùng `<script setup lang="ts">` — không dùng Options API, không dùng `defineComponent`
- Import type riêng: `import type { Foo } from '...'`
- Không dùng `any` — dùng `unknown` nếu chưa rõ type

### Auth

- JWT được lưu trong httpOnly cookie — không lưu localStorage
- Server middleware `auth.ts` verify token trước khi xử lý API request

### API & Services

- Không gọi `$fetch` / `fetch` trực tiếp trong component, composable, store
- Mọi API call đi qua `services/` — xem các file hiện có để hiểu pattern
- Service mới phải được import và đăng ký trong `services/index.ts`

### Styling

- **Tailwind CSS là mặc định** — dùng utility classes cho mọi styling
- **Không dùng `<style scoped>`** trừ 2 trường hợp duy nhất:
  1. Override style của third-party component với `:deep()`
  2. CSS animation phức tạp không có sẵn trong Tailwind (ví dụ: `@keyframes shimmer`)
- Khi muốn viết scoped CSS → dừng lại, thử viết bằng Tailwind trước

### Pinia Store

- Luôn dùng Setup Store — không dùng Options Store (`state: () => ({})`)
- Dùng `storeToRefs()` khi destructure state/getters
- Store chỉ chứa state + actions gọi service — không chứa UI logic

### Data Flow

- Logic tái sử dụng → composable; shared state → store

### Naming

- Component: PascalCase (`TicketCard.vue`)
- Composable: camelCase với prefix `use` (`useTicket.ts`)
- Store: camelCase với suffix `Store` (`useTicketStore.ts`)
- API route: kebab-case (`/api/tickets/[id]/status-update.patch.ts`)

### Forms

- Dùng vee-validate cho mọi form có validation — không tự viết validation logic
- Xem pattern: @docs/forms.md

### Toast / Notifications

- Dùng useToast() để hiển thị thông báo — không dùng alert()
- Gọi toast ở component/composable sau action, không gọi trong store
- Xem pattern: @docs/forms.md#toast

### Before Finishing Any Task

- Trước khi kết thúc task, LUÔN tự chạy review theo @docs/review.md:

- Nếu phát hiện vi phạm → tự sửa, không hỏi Nếu có trade-off cần quyết định → báo cáo rõ lý do giữ nguyên

### Dependencies

- Tailwind CSS là **v4** — syntax khác v3: không có `tailwind.config.js`, config qua CSS `@theme`, utility classes vẫn tương tự nhưng một số plugin thay đổi
- JWT dùng `jose` — không dùng `jsonwebtoken`
- Date handling dùng `date-fns` + `date-fns-tz` — không dùng `moment` hay `dayjs`

## Documentation

- Conventions & naming: @docs/conventions.md
- Architecture & data flow: @docs/architecture.md
- API response format: @docs/api-response.md
- Component patterns: @docs/components.md
- Forms & notifications: @docs/forms.md
- Code review checklist: @docs/review.md
- Database & migrations: @docs/database.md
- Dashboard: @docs/dashboard.md
