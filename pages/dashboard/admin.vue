<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex-1">
				<h2 class="text-xl font-bold text-gray-900">Tổng quan hệ thống</h2>
				<p class="text-sm text-gray-500 mt-0.5">Báo cáo và thống kê toàn hệ thống</p>
			</div>
			<DashboardDatePicker v-model="dateRange" />
		</div>

		<!-- Stat Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			<DashboardStatCard
				title="Tổng yêu cầu"
				:value="stats?.totalTickets?.value ?? 0"
				:previous-value="stats?.totalTickets?.previousValue"
				icon="i-heroicons-ticket"
				subtitle="Trong khoảng thời gian"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Chờ phê duyệt"
				:value="stats?.pendingApproval?.value ?? 0"
				icon="i-heroicons-clock"
				:highlight="(stats?.pendingApproval?.value ?? 0) > 0 ? 'amber' : undefined"
				subtitle="Cần TGĐ phê duyệt"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Đang thực hiện"
				:value="stats?.inProgress?.value ?? 0"
				icon="i-heroicons-arrow-path"
				highlight="blue"
				subtitle="Đang được xử lý"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Hoàn tất trong kỳ"
				:value="stats?.completedThisMonth?.value ?? 0"
				:previous-value="stats?.completedThisMonth?.previousValue"
				icon="i-heroicons-check-circle"
				highlight="green"
				subtitle="Đã completed/accepted"
				:loading="pending"
			/>
		</div>

		<!-- Loading skeleton for charts -->
		<template v-if="pending">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div class="bg-white rounded-xl border border-gray-200 p-5 h-[320px] flex items-center justify-center">
					<div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
				</div>
				<div class="bg-white rounded-xl border border-gray-200 p-5 h-[320px] flex items-center justify-center">
					<div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		</template>

		<template v-else>
			<!-- Charts row 1 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<DashboardChartsDonutChart
					v-if="statusDistData.labels.length > 0"
					:key="'donut-' + dataKey"
					title="Phân bố trạng thái yêu cầu"
					:labels="statusDistData.labels"
					:data="statusDistData.data"
					:colors="statusDistData.colors"
				/>
				<div v-else class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-[320px]">
					<p class="text-gray-400 text-sm">Không có dữ liệu</p>
				</div>

				<DashboardChartsBarChart
					:key="'dept-' + dataKey"
					title="Khối lượng theo phòng ban"
					:labels="byDeptLabels"
					:datasets="byDeptDatasets"
					:horizontal="true"
					:height="300"
				/>
			</div>

			<!-- Volume Trend -->
			<DashboardChartsLineChart
				:key="'trend-' + dataKey"
				title="Xu hướng yêu cầu (phân theo loại)"
				:labels="dashData?.volumeTrend?.labels ?? []"
				:datasets="volumeDatasets"
				:fill="false"
				:height="280"
			/>

			<!-- Charts row 2 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<DashboardChartsBarChart
					:key="'funnel-' + dataKey"
					title="Thời gian trung bình theo giai đoạn (ngày)"
					:labels="dashData?.approvalFunnel?.map((f: any) => f.stage) ?? []"
					:datasets="funnelDatasets"
					:height="260"
				/>
				<DashboardChartsBarChart
					:key="'rc-' + dataKey"
					title="Tỷ lệ hoàn tất / từ chối / huỷ theo tháng"
					:labels="dashData?.rejectionCancellation?.labels ?? []"
					:datasets="rcDatasets"
					:stacked="true"
					:height="260"
				/>
			</div>

			<!-- Approval Queue Table -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
					<UIcon name="i-heroicons-queue-list" class="text-amber-500" />
					<h3 class="font-semibold text-gray-800">Hàng chờ phê duyệt</h3>
					<UBadge v-if="approvalQueue.length > 0" color="warning" variant="soft" size="sm">
						{{ approvalQueue.length }}
					</UBadge>
				</div>

				<div v-if="approvalQueue.length === 0" class="py-12 text-center">
					<UIcon name="i-heroicons-check-badge" class="text-4xl text-green-400 mx-auto mb-2" />
					<p class="text-gray-400 text-sm">Không có yêu cầu nào đang chờ phê duyệt</p>
				</div>

				<div v-else class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
								<th class="px-4 py-3 text-left">Mã</th>
								<th class="px-4 py-3 text-left">Tiêu đề</th>
								<th class="px-4 py-3 text-left">Loại</th>
								<th class="px-4 py-3 text-left">Phòng ban</th>
								<th class="px-4 py-3 text-left">Ngày tạo</th>
								<th class="px-4 py-3 text-right">Chờ (ngày)</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							<tr
								v-for="ticket in approvalQueue"
								:key="ticket.id"
								class="hover:bg-gray-50 cursor-pointer"
								@click="router.push(`/tickets/${ticket.id}`)"
							>
								<td class="px-4 py-3 font-mono text-green-700 font-medium">{{ ticket.code }}</td>
								<td class="px-4 py-3 text-gray-800 max-w-xs truncate">{{ ticket.title }}</td>
								<td class="px-4 py-3">
									<UBadge :color="getTypeColor(ticket.type)" variant="soft" size="sm">
										{{ getTypeLabel(ticket.type) }}
									</UBadge>
								</td>
								<td class="px-4 py-3 text-gray-600">{{ ticket.department || '-' }}</td>
								<td class="px-4 py-3 text-gray-500">{{ formatDate(ticket.createdAt) }}</td>
								<td class="px-4 py-3 text-right">
									<span :class="[
										'inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold',
										ticket.daysWaiting > 3 ? 'bg-red-100 text-red-700' : ticket.daysWaiting > 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600',
									]">{{ ticket.daysWaiting }}</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({ layout: 'default' });

	const router = useRouter();
	const dateRange = ref({ from: '', to: '' });

	const { data, pending, refresh } = useAsyncData('dashboard-admin', () =>
		$fetch('/api/dashboard/admin', {
			query: { from: dateRange.value.from, to: dateRange.value.to },
		}),
	);

	watch(dateRange, () => {
		if (dateRange.value.from && dateRange.value.to) refresh();
	}, { deep: true });

	// Unique key to force chart re-creation on data change
	const dataKey = ref(0);
	watch(data, () => { dataKey.value++; });

	const dashData = computed(() => (data.value as any)?.data);
	const stats = computed(() => dashData.value?.stats);
	const approvalQueue = computed<any[]>(() => dashData.value?.approvalQueue ?? []);

	const STATUS_COLORS: Record<string, string> = {
		pending_review: '#3b82f6', in_review: '#8b5cf6', pending_approval: '#f59e0b',
		approved: '#22c55e', in_progress: '#3b82f6', completed: '#10b981',
		accepted: '#14b8a6', rejected: '#ef4444', cancelled: '#6b7280',
	};
	const STATUS_LABELS: Record<string, string> = {
		pending_review: 'Chờ tiếp nhận', in_review: 'Đang BA',
		pending_approval: 'Chờ phê duyệt', approved: 'Đã duyệt',
		in_progress: 'Đang thực hiện', completed: 'Hoàn tất',
		accepted: 'Đã nghiệm thu', rejected: 'Từ chối', cancelled: 'Đã huỷ',
	};

	const statusDistData = computed(() => {
		const raw: any[] = dashData.value?.statusDistribution ?? [];
		return {
			labels: raw.map(r => STATUS_LABELS[r.status] || r.status),
			data: raw.map(r => r.count),
			colors: raw.map(r => STATUS_COLORS[r.status] || '#6b7280'),
		};
	});

	const TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
	const TYPE_LABELS = ['Xử lý vận hành', 'Thay đổi & Tối ưu', 'Trích xuất dữ liệu', 'Phát triển tính năng'];

	const volumeDatasets = computed(() => {
		const raw = dashData.value?.volumeTrend?.datasets ?? [];
		return raw.map((ds: any, i: number) => ({ ...ds, color: TYPE_COLORS[i] }));
	});

	const byDeptLabels = computed(() => dashData.value?.byDepartment?.map((d: any) => d.department) ?? []);
	const byDeptDatasets = computed(() => [{
		label: 'Số yêu cầu',
		data: dashData.value?.byDepartment?.map((d: any) => d.count) ?? [],
		color: '#10b981',
	}]);

	const funnelDatasets = computed(() => [{
		label: 'Ngày trung bình',
		data: dashData.value?.approvalFunnel?.map((f: any) => f.avgDays) ?? [],
		color: '#3b82f6',
	}]);

	const rcDatasets = computed(() => {
		const raw = dashData.value?.rejectionCancellation?.datasets ?? [];
		return raw.map((ds: any) => ({ label: ds.label, data: ds.data, color: ds.color }));
	});

	const getTypeColor = (type: number) => ['success', 'warning', 'info', 'secondary'][type - 1] || 'neutral';
	const getTypeLabel = (type: number) => TYPE_LABELS[type - 1] || `Loại ${type}`;
	const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
</script>
