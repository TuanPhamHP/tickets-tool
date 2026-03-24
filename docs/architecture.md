# Architecture

## Overview

XC-Tickets là **SPA (Single Page Application)** — `ssr: false` trong `nuxt.config.ts`.

- **Client:** Vue 3 SPA chạy hoàn toàn trên browser
- **Server:** Nitro (`node-server`) xử lý API và kết nối MySQL
- **DB:** MySQL qua Drizzle ORM
- **Auth:** JWT lưu trong httpOnly cookie

```
Browser (Vue SPA)
    │
    │  HTTP /api/*
    ▼
Nitro Server (Node)
    │
    │  Drizzle ORM
    ▼
MySQL Database
```

---

## Data Flow

### Luồng chuẩn: Component → Service → API → DB

```
Component / Page
    │  gọi action
    ▼
Pinia Store (action)
    │  gọi service
    ▼
services/ (HTTP wrapper)
    │  $fetch /api/...
    ▼
server/api/*.ts (Nitro handler)
    │  requireAuth() → verify JWT
    │  readBody() / getRouterParam()
    │  useDB() → Drizzle query
    ▼
MySQL
    │
    ▼  trả về apiSuccess({ data })
server/api/*.ts
    ▼
services/
    ▼
Pinia Store (cập nhật state)
    ▼
Component re-render
```

**Quy tắc bắt buộc:**

- Component **không bao giờ** gọi `$fetch` trực tiếp
- Mọi HTTP call đi qua `services/`
- Store chỉ chứa state + gọi service — không chứa UI logic
- Toast/notification gọi ở component sau khi action store resolve, không gọi trong store

---

## API Layer (`server/api/`)

### Cấu trúc file

Nuxt tự động map tên file thành route và HTTP method:

```
server/api/tickets/index.get.ts     → GET    /api/tickets
server/api/tickets/index.post.ts    → POST   /api/tickets
server/api/tickets/[id].get.ts      → GET    /api/tickets/:id
server/api/tickets/[id].put.ts      → PUT    /api/tickets/:id
server/api/tickets/[id].delete.ts   → DELETE /api/tickets/:id
```

### Anatomy của một API handler

Lấy ví dụ từ `server/api/tickets/[id].put.ts`:

```typescript
export default defineEventHandler(async event => {
    // 1. Auth — luôn là bước đầu tiên
    const auth = await requireAuth(event)          // throw 401 nếu không có token

    // 2. Parse params / body
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody(event)

    // 3. Validate + authorization
    if (auth.role !== 'admin' && ticket.requesterId !== Number(auth.sub)) {
        throw createError({ statusCode: 403, statusMessage: '...' })
    }

    // 4. Business logic + DB query
    const db = useDB()
    await db.update(tickets).set(updates).where(eq(tickets.id, id))

    // 5. Ghi audit log (với các action thay đổi state)
    await db.insert(ticketHistory).values({ ... })

    // 6. Trả về chuẩn
    return apiSuccess(updated, 'Cập nhật thành công')
})
```

### Utils dùng trong handler

| Utility                                      | Mô tả                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `requireAuth(event)`                         | Verify JWT, trả về `{ sub, role, ... }`. Throw 401 nếu invalid     |
| `useDB()`                                    | Trả về Drizzle instance kết nối MySQL                              |
| `apiSuccess(data, message?)`                 | Wrap response theo format chuẩn `{ success: true, data, message }` |
| `createError({ statusCode, statusMessage })` | Throw HTTP error — Nitro tự handle                                 |

### Response format chuẩn

```typescript
// Success
{ success: true, data: T, message?: string }

// Error (do createError() — Nitro tự format)
{ statusCode: number, statusMessage: string }
```

---

## Service Layer (`services/`)

Wrap toàn bộ `$fetch` call, đăng ký vào plugin Nuxt tại `services/index.ts`.

### Pattern

Mỗi service là một factory function nhận `baseUrl` và trả về object methods:

```typescript
// services/ticket.ts
export default (baseUrl: string) => ({
	getList: (params?: Record<string, unknown>) =>
		$fetch('/api/tickets', { baseURL: baseUrl, params }),

	getById: (id: number) =>
		$fetch(`/api/tickets/${id}`, { baseURL: baseUrl }),

	create: (body: unknown) =>
		$fetch('/api/tickets', { baseURL: baseUrl, method: 'POST', body }),

	update: (id: number, body: unknown) =>
		$fetch(`/api/tickets/${id}`, { baseURL: baseUrl, method: 'PUT', body }),
});
```

### Đăng ký & sử dụng

Tất cả services được gom vào một object `$api` duy nhất qua Nuxt plugin:

```typescript
// services/index.ts — Nuxt plugin
export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const baseUrl = config.public.apiBaseUrl as string;
	return {
		provide: {
			api: {
				ticket: ticket(baseUrl),
				user: user(baseUrl),
				department: department(baseUrl),
				notification: notification(baseUrl),
				// ...
			},
		},
	};
});
```

```typescript
// Trong component hoặc store action
const { $api } = useNuxtApp();
const res = await $api.ticket.getById(id);
```

**Không được** import service trực tiếp vào component. Gọi thẳng `$api` trong component hoặc qua store action tuỳ mức độ cần share state.

---

## State Management (`store/`)

### Setup Store pattern (bắt buộc)

Dự án yêu cầu **Setup Store** — không dùng Options Store.

```typescript
// ✅ Đúng — Setup Store
export const useTicketStore = defineStore('ticket', () => {
    const tickets = ref<Ticket[]>([])
    const loading = ref(false)

    async function fetchAll() {
        const { $api } = useNuxtApp()
        loading.value = true
        try {
            const res = await $api.ticket.getList() as any
            tickets.value = res?.data?.tickets || []
        } finally {
            loading.value = false
        }
    }

    return { tickets, loading, fetchAll }
})

// ❌ Sai — Options Store
export const useTicketStore = defineStore('ticket', {
    state: () => ({ tickets: [] }),
    actions: { async fetchAll() { ... } }
})
```

> **Lưu ý:** `store/appState.ts` hiện tại đang dùng Options Store — đây là exception từ trước, các store mới phải dùng Setup Store.

### Destructure với storeToRefs

```typescript
// ✅ Đúng
const store = useTicketStore();
const { tickets, loading } = storeToRefs(store);
const { fetchAll } = store; // action không cần storeToRefs

// ❌ Sai — mất reactivity
const { tickets } = useTicketStore();
```

### Store catalog

| Store                          | Trách nhiệm                                              |
| ------------------------------ | -------------------------------------------------------- |
| `useAppStateStore`             | Global UI state: loading, sidebar, app lifecycle         |
| _(các store khác theo domain)_ | Mỗi entity có store riêng: ticket, user, notification... |

---

## Auth Flow

```
1. POST /api/auth/login
   └─ Server verify credentials → sign JWT → set httpOnly cookie

2. Mọi request sau đó
   └─ Browser tự đính cookie
   └─ requireAuth(event) verify JWT ở mỗi handler

3. Server middleware: server/middleware/auth.ts
   └─ Chạy trước mọi /api/* request
   └─ Attach user info vào event context

4. Client middleware: middleware/
   └─ Guard route, redirect về /login nếu chưa auth
```

---

## Runtime Config

Tách biệt rõ server-only vs public:

```typescript
// nuxt.config.ts
runtimeConfig: {
    // Server-only — KHÔNG expose ra client
    jwtSecret: '...',
    dbHost: '...', dbPort: '...', dbUser: '...', dbPassword: '...', dbName: '...',

    public: {
        // Expose ra cả client lẫn server
        apiBaseUrl: '...',
        kztekBaseUrl: '...',
        xApiKey: '...',
        minioBaseUrl: '...',
    }
}
```

```typescript
// Truy cập trong server handler
const config = useRuntimeConfig();
config.jwtSecret; // ✅ server-only
config.public.apiBaseUrl; // ✅ cả hai

// Truy cập trong component/composable
const config = useRuntimeConfig();
config.public.apiBaseUrl; // ✅
config.jwtSecret; // ❌ undefined ở client
```

---

## Nuxt Modules

| Module         | Dùng để                                                            |
| -------------- | ------------------------------------------------------------------ |
| `@nuxt/ui`     | Component library (Button, Modal, Form...) — theme `light` cố định |
| `@nuxt/image`  | Optimize image, tích hợp MinIO                                     |
| `@nuxt/icon`   | Icon system                                                        |
| `@pinia/nuxt`  | Pinia SSR-safe integration                                         |
| `@nuxt/eslint` | ESLint config auto-setup                                           |

## Key Dependencies

| Package                    | Version | Dùng để                                            |
| -------------------------- | ------- | -------------------------------------------------- |
| `@nuxt/ui`                 | 3.0.1   | Component library (based on Reka UI + Tailwind v4) |
| `tailwindcss`              | ^4      | Styling — **v4, không phải v3**                    |
| `drizzle-orm`              | ^0.45   | ORM — query builder type-safe                      |
| `mysql2`                   | ^3      | MySQL driver cho Drizzle                           |
| `jose`                     | ^6      | JWT sign/verify (thay thế jsonwebtoken)            |
| `bcryptjs`                 | ^3      | Hash password                                      |
| `date-fns` + `date-fns-tz` | ^4 / ^3 | Date formatting, timezone-aware                    |
| `marked`                   | ^17     | Render Markdown (dùng trong ticket description?)   |
