# API Response Reference

Tài liệu mô tả cấu trúc response của tất cả API endpoints theo từng module.

---

## Cấu trúc chung

### `apiSuccess` — dữ liệu đơn
```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }
}
```

### `apiPaginated` — danh sách phân trang
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error response (Nitro H3)
```json
{
  "statusCode": 400,
  "statusMessage": "Mô tả lỗi"
}
```

---

## Module: Auth

### `POST /api/auth/login`
**Body:** `{ email, password }`

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "admin@xc.vn",
      "role": "admin",
      "phone": "0909000001",
      "company": "Xuân Cương",
      "avatar": null,
      "isActive": true,
      "departmentId": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```
> Đồng thời set HTTP-only cookie `auth_token` (7 ngày).

---

### `GET /api/auth/me`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "admin@xc.vn",
    "role": "admin",
    "phone": "0909000001",
    "company": "Xuân Cương",
    "avatar": null,
    "isActive": true,
    "departmentId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### `POST /api/auth/change-password`
**Auth:** Bắt buộc
**Body:** `{ currentPassword, newPassword }`

```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công",
  "data": null
}
```

---

## Module: Tickets

### `GET /api/tickets`
**Auth:** Bắt buộc
**Query:** `page`, `limit`, `status`, `type` (1-4), `priority`, `search`, `departmentId`

> **Lọc theo role:**
> - `requester` → chỉ thấy ticket của mình
> - `approver` → thấy ticket mình phê duyệt + ticket đang `pending_approval`
> - `implementer` → thấy ticket được assign + ticket ở trạng thái `pending_review`, `approved`, `in_progress`, `completed`
> - `admin` → thấy tất cả

```json
{
  "success": true,
  "data": [
    {
      "ticket": {
        "id": 1,
        "code": "XC-2025-001",
        "title": "Cần hỗ trợ in ấn",
        "description": "<p>Mô tả chi tiết...</p>",
        "type": 1,
        "status": "approved",
        "priority": "medium",
        "requesterId": 3,
        "approverId": null,
        "implementerId": null,
        "departmentId": 2,
        "deadline": null,
        "reviewerId": null,
        "estimateDays": null,
        "estimateCost": null,
        "estimateNote": null,
        "reviewedAt": null,
        "implementationNote": null,
        "acceptanceNote": null,
        "approvalNote": null,
        "rejectionReason": null,
        "cancelReason": null,
        "approvedAt": null,
        "rejectedAt": null,
        "startedAt": null,
        "completedAt": null,
        "acceptedAt": null,
        "cancelledAt": null,
        "createdAt": "2025-01-15T08:00:00.000Z",
        "updatedAt": "2025-01-15T08:00:00.000Z"
      },
      "requester": {
        "id": 3,
        "name": "Trần Thị B",
        "email": "b@xc.vn",
        "role": "requester"
      },
      "department": {
        "id": 2,
        "name": "Phòng Kế Toán",
        "company": "Xuân Cương",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### `POST /api/tickets`
**Auth:** Bắt buộc | **Role:** `admin`, `requester`
**Body:** `{ title*, type* (1-4), description, priority, departmentId, deadline }`

> Mọi loại → `status = "draft"`. Cần submit để đưa vào luồng xử lý.

```json
{
  "success": true,
  "message": "Tạo yêu cầu thành công",
  "data": {
    "id": 10,
    "code": "XC-2025-010",
    "title": "Yêu cầu mới",
    "type": 2,
    "status": "draft",
    "priority": "medium",
    "requesterId": 3,
    "departmentId": 1,
    "createdAt": "2025-01-20T09:00:00.000Z",
    "updatedAt": "2025-01-20T09:00:00.000Z",
    "..."  : "các trường còn lại null"
  }
}
```

---

### `GET /api/tickets/:id`
**Auth:** Bắt buộc
> `requester` chỉ xem được ticket của mình

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "id": 1,
    "code": "XC-2025-001",
    "title": "Cần hỗ trợ in ấn",
    "description": "<p>Mô tả...</p>",
    "type": 1,
    "status": "in_progress",
    "priority": "high",
    "requesterId": 3,
    "approverId": null,
    "implementerId": 4,
    "departmentId": 2,
    "deadline": "2025-02-01T00:00:00.000Z",
    "reviewerId": 4,
    "estimateDays": 3,
    "estimateCost": 5000000,
    "estimateNote": "Dự kiến hoàn thành trong 3 ngày làm việc",
    "reviewedAt": "2025-01-16T10:00:00.000Z",
    "implementationNote": null,
    "acceptanceNote": null,
    "approvalNote": null,
    "rejectionReason": null,
    "cancelReason": null,
    "approvedAt": null,
    "startedAt": "2025-01-17T08:00:00.000Z",
    "completedAt": null,
    "acceptedAt": null,
    "cancelledAt": null,
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-01-17T08:00:00.000Z",
    "requester": {
      "id": 3,
      "name": "Trần Thị B",
      "email": "b@xc.vn",
      "phone": "0909000003"
    },
    "approver": null,
    "implementer": {
      "id": 4,
      "name": "Lê Văn C",
      "email": "c@xc.vn"
    },
    "department": {
      "id": 2,
      "name": "Phòng Kế Toán",
      "company": "Xuân Cương",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "comments": [
      {
        "comment": {
          "id": 5,
          "ticketId": 1,
          "userId": 4,
          "content": "Đang xử lý, @[Trần Thị B] vui lòng chờ",
          "createdAt": "2025-01-17T09:00:00.000Z",
          "updatedAt": "2025-01-17T09:00:00.000Z"
        },
        "user": {
          "id": 4,
          "name": "Lê Văn C",
          "avatar": null,
          "role": "implementer"
        }
      }
    ],
    "attachments": [],
    "history": [
      {
        "history": {
          "id": 1,
          "ticketId": 1,
          "userId": 3,
          "action": "created",
          "fromStatus": null,
          "toStatus": "approved",
          "note": "Tạo yêu cầu mới: Cần hỗ trợ in ấn",
          "createdAt": "2025-01-15T08:00:00.000Z"
        },
        "user": {
          "id": 3,
          "name": "Trần Thị B",
          "role": "requester"
        }
      }
    ]
  }
}
```

---

### `POST /api/tickets/:id/submit`
**Auth:** Bắt buộc | **Role:** `admin`, `requester`
**Yêu cầu:** status = `draft` hoặc `rejected`

```json
{
  "success": true,
  "message": "Yêu cầu đã được nộp, đang chờ bên công nghệ xem xét",
  "data": { "...ticket": "object đầy đủ, status = pending_review" }
}
```
> Mọi loại ticket đều chuyển sang `pending_review` để implementer estimate trước.

---

### `POST /api/tickets/:id/review`
**Auth:** Bắt buộc | **Role:** `admin`, `implementer`
**Body:** `{ estimateDays*, estimateCost*, estimateNote? }`
**Yêu cầu:** status = `pending_review`

```json
{
  "success": true,
  "message": "Đã xem xét — yêu cầu chờ phê duyệt từ Phó Tổng Giám Đốc",
  "data": { "...ticket": "object, reviewerId, estimateDays, estimateCost, estimateNote, reviewedAt đã được set" }
}
```
> Type 1: chuyển sang `approved` thẳng (không qua phê duyệt). `estimateCost` chỉ hiển thị cho `approver`/`admin`.

---

### `POST /api/tickets/:id/approve`
**Auth:** Bắt buộc | **Role:** `admin`, `approver`
**Body:** `{ note? }`
**Yêu cầu:** status = `pending_approval`

```json
{
  "success": true,
  "message": "Đã phê duyệt yêu cầu",
  "data": { "...ticket": "object, status = approved, approverId, approvedAt, approvalNote đã được set" }
}
```

---

### `POST /api/tickets/:id/reject`
**Auth:** Bắt buộc | **Role:** `admin`, `approver`
**Body:** `{ reason* }`
**Yêu cầu:** status = `pending_approval`

```json
{
  "success": true,
  "message": "Đã từ chối yêu cầu",
  "data": { "...ticket": "object, status = rejected, rejectionReason, rejectedAt đã được set" }
}
```

---

---

### `POST /api/tickets/:id/start`
**Auth:** Bắt buộc | **Role:** `admin`, `implementer`
**Body:** `{ note? }`
**Yêu cầu:** status = `approved`

```json
{
  "success": true,
  "message": "Đã bắt đầu thực hiện yêu cầu",
  "data": { "...ticket": "object, status = in_progress, implementerId, startedAt đã được set" }
}
```

---

### `POST /api/tickets/:id/complete`
**Auth:** Bắt buộc | **Role:** `admin`, `implementer` (chỉ implementer được assign)
**Body:** `{ note? }`
**Yêu cầu:** status = `in_progress`

```json
{
  "success": true,
  "message": "Đã hoàn tất yêu cầu, chờ nghiệm thu",
  "data": { "...ticket": "object, status = completed, implementationNote, completedAt đã được set" }
}
```

---

### `POST /api/tickets/:id/accept`
**Auth:** Bắt buộc | **Role:** `admin`, `requester` (chỉ requester của ticket)
**Body:** `{ note? }`
**Yêu cầu:** status = `completed`

```json
{
  "success": true,
  "message": "Đã nghiệm thu yêu cầu",
  "data": { "...ticket": "object, status = accepted, acceptanceNote, acceptedAt đã được set" }
}
```

---

### `POST /api/tickets/:id/cancel`
**Auth:** Bắt buộc | **Role:** requester của ticket hoặc `admin`
**Body:** `{ reason* }`
**Các status có thể huỷ:** `draft`, `pending_review`, `pending_approval`, `approved`, `rejected`

```json
{
  "success": true,
  "message": "Đã huỷ yêu cầu",
  "data": { "...ticket": "object, status = cancelled, cancelReason, cancelledAt đã được set" }
}
```

---

### `PUT /api/tickets/:id`
**Auth:** Bắt buộc
**Body:** `{ title?, description?, type?, priority?, departmentId?, deadline? }`
**Yêu cầu:** status = `draft`, `rejected`, hoặc `pending_approval`

```json
{
  "success": true,
  "message": "Cập nhật yêu cầu thành công",
  "data": { "...ticket": "object đầy đủ sau khi cập nhật" }
}
```

---

### `DELETE /api/tickets/:id`
**Auth:** Bắt buộc | requester của ticket hoặc `admin`
**Yêu cầu:** status = `draft`, `rejected`, hoặc `cancelled`

```json
{
  "success": true,
  "message": "Xóa yêu cầu thành công",
  "data": null
}
```

---

## Module: Comments

### `GET /api/tickets/:id/comments`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Thành công",
  "data": [
    {
      "id": 5,
      "content": "Đang xử lý, @[Trần Thị B] vui lòng chờ",
      "createdAt": "2025-01-17T09:00:00.000Z",
      "updatedAt": "2025-01-17T09:00:00.000Z",
      "user": {
        "id": 4,
        "name": "Lê Văn C",
        "avatar": null,
        "role": "implementer"
      }
    }
  ]
}
```
> Sắp xếp mới nhất trước (desc). Cú pháp mention trong content: `@[Tên người dùng]`

---

### `POST /api/tickets/:id/comments`
**Auth:** Bắt buộc
**Body:** `{ content* }`

```json
{
  "success": true,
  "message": "Đã thêm bình luận",
  "data": {
    "id": 6,
    "ticketId": 1,
    "userId": 4,
    "content": "Hoàn tất rồi nhé @[Trần Thị B]",
    "createdAt": "2025-01-18T10:00:00.000Z",
    "updatedAt": "2025-01-18T10:00:00.000Z"
  }
}
```
> Tự động gửi thông báo cho người được `@mention` và requester của ticket.

---

## Module: Notifications

### `GET /api/notifications`
**Auth:** Bắt buộc
**Query:** `page`, `limit`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "submitted",
      "message": "Yêu cầu mới \"Cần hỗ trợ in ấn\" chờ phê duyệt",
      "isRead": false,
      "createdAt": "2025-01-15T08:05:00.000Z",
      "ticketId": 1,
      "ticketCode": "XC-2025-001",
      "ticketTitle": "Cần hỗ trợ in ấn",
      "actorId": 3,
      "actorName": "Trần Thị B",
      "actorAvatar": null
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "unreadCount": 5
  }
}
```

> **Các giá trị `type`:** `submitted`, `approved`, `rejected`, `started`, `completed`, `accepted`, `cancelled`, `commented`, `mentioned`

---

### `GET /api/notifications/unread-count`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "count": 5
  }
}
```

---

### `PATCH /api/notifications/:id/read`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Đã đọc",
  "data": null
}
```

---

### `PATCH /api/notifications/read-all`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Đã đánh dấu tất cả là đã đọc",
  "data": null
}
```

---

## Module: Users

### `GET /api/users`
**Auth:** Bắt buộc | **Role:** `admin`, `approver`
**Query:** `page`, `limit`, `role`, `search`, `departmentId`, `isActive`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "admin@xc.vn",
      "role": "admin",
      "company": "Xuân Cương",
      "phone": "0909000001",
      "avatar": null,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "department": {
        "id": 1,
        "name": "Ban Giám Đốc",
        "company": "Xuân Cương",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `POST /api/users`
**Auth:** Bắt buộc | **Role:** `admin`
**Body:** `{ name*, email*, password*, role*, departmentId?, company?, phone? }`

```json
{
  "success": true,
  "message": "Tạo tài khoản thành công",
  "data": {
    "id": 5,
    "name": "Phạm Thị D",
    "email": "d@xc.vn",
    "role": "requester",
    "company": "Xuân Cương",
    "phone": null,
    "avatar": null,
    "isActive": true,
    "departmentId": 3,
    "createdAt": "2025-01-20T00:00:00.000Z",
    "updatedAt": "2025-01-20T00:00:00.000Z"
  }
}
```

---

### `PUT /api/users/:id`
**Auth:** Bắt buộc
**Body (user tự sửa):** `{ name?, phone?, avatar? }`
**Body (admin):** `+ { role?, departmentId?, company?, isActive?, password? }`

```json
{
  "success": true,
  "message": "Cập nhật tài khoản thành công",
  "data": { "...user": "object đầy đủ, không có passwordHash" }
}
```

---

### `GET /api/users/mention`
**Auth:** Bắt buộc

```json
{
  "success": true,
  "message": "Thành công",
  "data": [
    { "id": 1, "name": "Nguyễn Văn A", "avatar": null },
    { "id": 3, "name": "Trần Thị B", "avatar": null },
    { "id": 4, "name": "Lê Văn C", "avatar": null }
  ]
}
```

---

## Module: Departments

### `GET /api/departments`
**Auth:** Bắt buộc
**Query:** `page`, `limit`, `search`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ban Giám Đốc",
      "company": "Xuân Cương",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 7,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `POST /api/departments`
**Auth:** Bắt buộc | **Role:** `admin`
**Body:** `{ name*, company? }`

```json
{
  "success": true,
  "message": "Tạo phòng ban thành công",
  "data": {
    "id": 8,
    "name": "Phòng Marketing",
    "company": "Xuân Cương",
    "createdAt": "2025-01-20T00:00:00.000Z",
    "updatedAt": "2025-01-20T00:00:00.000Z"
  }
}
```

---

### `PUT /api/departments/:id`
**Auth:** Bắt buộc | **Role:** `admin`
**Body:** `{ name?, company? }`

```json
{
  "success": true,
  "message": "Cập nhật phòng ban thành công",
  "data": {
    "id": 8,
    "name": "Phòng Marketing & Truyền thông",
    "company": "Xuân Cương",
    "createdAt": "2025-01-20T00:00:00.000Z",
    "updatedAt": "2025-01-21T00:00:00.000Z"
  }
}
```

---

## Enum & Constants

### Ticket Status
| Giá trị | Hiển thị | Ghi chú |
|---|---|---|
| `draft` | Nháp | Mới tạo, chưa nộp |
| `pending_review` | Chờ tech xem xét | Sau khi submit — implementer cần estimate |
| `pending_approval` | Chờ phê duyệt | Sau khi tech review (type 2,3,4) — chờ Phó TGĐ |
| `approved` | Đã duyệt | Sau review type 1, hoặc sau khi Phó TGĐ approve |
| `in_progress` | Đang thực hiện | Implementer đã bắt đầu |
| `completed` | Hoàn tất | Implementer đã hoàn thành |
| `accepted` | Đã nghiệm thu | Requester đã nghiệm thu |
| `rejected` | Từ chối | Approver từ chối — có thể resubmit |
| `cancelled` | Đã huỷ | Requester/admin huỷ |

### Ticket Type
| Giá trị | Tên | Phê duyệt |
|---|---|---|
| `1` | Xử lý vận hành | Tự động duyệt |
| `2` | Thay đổi và tối ưu | Cần phê duyệt |
| `3` | Trích xuất dữ liệu (xây module) | Cần phê duyệt |
| `4` | Phát triển tính năng mới | Cần phê duyệt |

### Ticket Priority
| Giá trị | Hiển thị |
|---|---|
| `low` | Thấp |
| `medium` | Trung bình |
| `high` | Cao |
| `urgent` | Khẩn cấp |

### User Role
| Giá trị | Hiển thị | Quyền hạn chính |
|---|---|---|
| `admin` | Quản trị viên | Toàn quyền |
| `requester` | Người yêu cầu | Tạo, submit, cancel, accept ticket |
| `approver` | Người phê duyệt | Approve, reject ticket |
| `implementer` | Người thực hiện | Estimate, start, complete ticket |

### Notification Type
| Giá trị | Khi nào gửi |
|---|---|
| `submitted` | Ticket được nộp — notify implementer |
| `reviewed` | Implementer đã estimate — notify requester + approver |
| `approved` | Phó TGĐ phê duyệt — notify requester + implementer |
| `rejected` | Ticket bị từ chối |
| `started` | Implementer bắt đầu thực hiện |
| `completed` | Ticket hoàn tất, chờ nghiệm thu |
| `accepted` | Ticket được nghiệm thu |
| `cancelled` | Ticket bị huỷ |
| `commented` | Có bình luận mới trên ticket |
| `mentioned` | Được tag `@mention` trong bình luận |
