# Task: Build 3 Dashboard Pages for XC-Tickets

## Context

XC-Tickets is a ticket management system between a client company and a vendor (8 Giờ Solutions).

**Tech stack:** Nuxt 4, TypeScript, Drizzle ORM, Tailwind CSS. Use `shadcn-vue` for components, `vue-chartjs` (wrapping Chart.js) for charts.

**Ticket types:**

- Type 1 (Operations): `draft → pending_review → approved → in_progress → completed → accepted`
- Type 2/3/4 (Change/Data/Feature): `draft → pending_review → pending_approval → approved → in_progress → completed → accepted`
- Can be `cancelled` from: draft, pending_review, pending_approval, approved, rejected
- `rejected` tickets can be resubmitted

**Roles:** admin, approver (TGĐ), requester (by department), implementer (8 Giờ vendor)

---

## Page 1: `/dashboard/admin` — Admin & Approver Dashboard

### Stat Cards (top row)

1. **Total Tickets** — all time, with delta vs last month
2. **Pending Approval** — tickets in `pending_approval` state (requires TGĐ action) — highlight in amber if > 0
3. **In Progress** — tickets currently being worked on
4. **Completed This Month** — tickets reached `completed` or `accepted` this month

### Charts

5. **Ticket Status Distribution** — Donut chart: count per status (exclude draft)
6. **Ticket Volume Trend** — Line chart: tickets created per week for last 12 weeks, grouped by type (Type 1–4)
7. **By Department** — Horizontal bar chart: ticket count per department (requester's department)
8. **Approval Funnel** — Bar chart showing avg days at each stage: pending_review → pending_approval → approved → in_progress → completed
9. **Rejection & Cancellation Rate** — Stacked bar by month: completed vs rejected vs cancelled

### Action Table

10. **Approval Queue** — Table listing tickets in `pending_approval`: columns = ticket ID, title, type, requester department, created date, days waiting. Sorted by days waiting desc.

---

## Page 2: `/dashboard/requester` — Requester Dashboard (scoped to current user's department)

### Stat Cards

1. **My Open Tickets** — tickets not yet `completed` or `accepted` or `cancelled`
2. **Action Required** — tickets in `rejected` state needing resubmit — highlight red if > 0
3. **Awaiting My Acceptance** — tickets in `completed` state waiting for requester to accept — highlight amber if > 0
4. **Completed This Month** — tickets reached `accepted` this month

### Charts

5. **My Tickets by Status** — Donut chart: current ticket distribution by status
6. **Monthly Submission Trend** — Bar chart: tickets submitted per month for last 6 months
7. **Ticket Type Breakdown** — Bar chart: distribution across Type 1–4
8. **Avg Resolution Time** — Bar chart: avg days from `approved` → `completed` per ticket type

### Table

9. **Active Tickets** — Table: ticket ID, title, type, current status, last updated, days open. Highlight rows where status = `rejected` or `completed` (needs action).

---

## Page 3: `/dashboard/implementer` — Implementer Dashboard (scoped to 8 Giờ company)

### Stat Cards

1. **Active Workload** — tickets in `in_progress`
2. **Incoming Queue** — tickets in `approved` not yet picked up — highlight if > 0
3. **Pending Client Acceptance** — tickets in `completed` waiting for client to accept
4. **Delivered This Month** — tickets moved to `completed` this month

### Charts

5. **Workload by Type** — Horizontal bar: in_progress count per ticket type
6. **Weekly Throughput** — Line chart: tickets completed per week for last 8 weeks
7. **Cycle Time by Type** — Bar chart: avg days from `in_progress` → `completed` grouped by Type 1–4
8. **Status Pipeline** — Stacked bar: approved → in_progress → completed → accepted counts

### Table

9. **Current Workload** — Table: ticket ID, title, type, requester department, days in progress, status. Sort by days in progress desc.

---

## Implementation Notes

- Create a shared `DashboardLayout` component with role-based navigation
- All data fetched via Nuxt server routes (`server/api/dashboard/`), called from pages using `useFetch` or `useAsyncData`
- Each server route queries via Drizzle ORM and returns aggregated stats — do NOT compute stats on the frontend
- Use `date-fns` for all date calculations
- Mock data is acceptable if DB queries are not yet wired — use realistic Vietnamese department names and ticket counts
- Stat cards should show a trend indicator (↑↓) comparing current period vs equivalent previous period
- Charts must be responsive — wrap `vue-chartjs` components in a div with `w-full` and set `responsive: true, maintainAspectRatio: false` in Chart.js options
- Color scheme: use status-consistent colors across all charts (e.g., `in_progress` = blue, `pending_approval` = amber, `rejected` = red, `completed` = green, `accepted` = teal)

---

## File Structure Expected

```
app/
  pages/
    dashboard/
      admin.vue
      requester.vue
      implementer.vue
  components/
    dashboard/
      StatCard.vue
      DateRangePicker.vue
      ApprovalQueueTable.vue
      ActiveTicketsTable.vue
      WorkloadTable.vue
      charts/
        DonutChart.vue
        LineChart.vue
        BarChart.vue
server/
  api/
    dashboard/
      admin.get.ts
      requester.get.ts
      implementer.get.ts
lib/
  dashboard-queries.ts   ← Drizzle queries for each dashboard
```

---

## Date Range Filter — Global Requirement

### Filter Component

- Add a **DateRangePicker** component (use `shadcn-vue` Calendar + Popover) at the top of each dashboard page
- Presets: `Last 7 days`, `Last 30 days`, `Last 3 months`, `This year`, `Custom`
- Default: `Last 30 days`
- Filter state managed with `useState` or `ref` in the page, passed as query params to all API calls: `?from=2025-01-01&to=2025-03-31`
- Use `watch` on the date range to trigger `refresh()` from `useAsyncData`
- All stat cards, charts, AND tables must re-fetch when date range changes
- The trend delta on stat cards compares current range vs the equivalent previous period (e.g. range = 30 days → compare vs prior 30 days)

### API Contract

All 3 server routes must read and apply `from` / `to` from `getQuery(event)`:

```ts
// server/api/dashboard/admin.get.ts
import { getQuery } from 'h3';

export default defineEventHandler(async event => {
	const { from, to } = getQuery(event);
	// pass to Drizzle queries
});
```

### Drizzle Query Pattern

```ts
// lib/dashboard-queries.ts
import { and, gte, lte } from 'drizzle-orm';

const dateFilter = and(gte(tickets.createdAt, new Date(from)), lte(tickets.createdAt, new Date(to)));
```

### useFetch Pattern in Pages

```ts
// app/pages/dashboard/admin.vue
const { from, to } = useDateRange(); // composable wrapping the DateRangePicker state

const { data, refresh } = await useAsyncData('admin-dashboard', () =>
	$fetch('/api/dashboard/admin', { query: { from, to } }),
);

watch([from, to], () => refresh());
```

### UX Notes

- Show selected range label in chart subtitles: e.g. `"01/01/2025 – 31/03/2025"`
- Disable future dates in the picker
- If `from > to`, show validation error inline, do not fire API call
- Time-series charts must auto-adjust granularity: ≤14 days → group by day, ≤90 days → group by week, >90 days → group by month
