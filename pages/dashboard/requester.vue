<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex-1">
				<h2 class="text-xl font-bold text-gray-900">Tổng quan yêu cầu của tôi</h2>
				<p class="text-sm text-gray-500 mt-0.5">Theo dõi tiến độ yêu cầu của phòng ban</p>
			</div>
			<DashboardDatePicker v-model="dateRange" />
		</div>

		<!-- Stat Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			<DashboardStatCard
				title="Đang mở"
				:value="stats?.openTickets?.value ?? 0"
				icon="i-heroicons-folder-open"
				subtitle="Chưa hoàn tất hoặc huỷ"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Cần xử lý"
				:value="stats?.actionRequired?.value ?? 0"
				icon="i-heroicons-exclamation-triangle"
				:highlight="(stats?.actionRequired?.value ?? 0) > 0 ? 'red' : undefined"
				subtitle="Bị từ chối, cần gửi lại"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Chờ nghiệm thu"
				:value="stats?.awaitingAcceptance?.value ?? 0"
				icon="i-heroicons-hand-raised"
				:highlight="(stats?.awaitingAcceptance?.value ?? 0) > 0 ? 'amber' : undefined"
				subtitle="Đã hoàn tất, cần xác nhận"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Đã nghiệm thu trong kỳ"
				:value="stats?.completedThisMonth?.value ?? 0"
				:previous-value="stats?.completedThisMonth?.previousValue"
				icon="i-heroicons-check-circle"
				highlight="green"
				subtitle="So với kỳ trước"
				:loading="pending"
			/>
		</div>

		<!-- Loading skeleton -->
		<div v-if="pending" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl border border-gray-200 p-5 h-[320px] flex items-center justify-center">
				<div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-5 h-[320px] flex items-center justify-center">
				<div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
			</div>
		</div>

		<template v-else>
			<!-- Charts row 1 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<DashboardChartsDonutChart
					v-if="statusDistData.labels.length > 0"
					:key="'donut-' + dataKey"
					title="Yêu cầu của tôi theo trạng thái"
					:labels="statusDistData.labels"
					:data="statusDistData.data"
					:colors="statusDistData.colors"
				/>
				<div v-else class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-[320px]">
					<p class="text-gray-400 text-sm">Không có dữ liệu</p>
				</div>

				<DashboardChartsBarChart
					:key="'monthly-' + dataKey"
					title="Xu hướng gửi yêu cầu theo tháng"
					:labels="dashData?.monthlyTrend?.labels ?? []"
					:datasets="monthlyDatasets"
					:height="280"
				/>
			</div>

			<!-- Charts row 2 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<DashboardChartsBarChart
					:key="'type-' + dataKey"
					title="Phân loại yêu cầu"
					:labels="TYPE_LABELS"
					:datasets="typeDatasets"
					:height="240"
				/>
				<DashboardChartsBarChart
					:key="'resolution-' + dataKey"
					title="Thời gian xử lý trung bình (ngày) — Duyệt đến Hoàn tất"
					:labels="TYPE_LABELS"
					:datasets="resolutionDatasets"
					:height="240"
				/>
			</div>

			<!-- Active Tickets Table -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
					<UIcon name="i-heroicons-list-bullet" class="text-green-600" />
					<h3 class="font-semibold text-gray-800">Yêu cầu trong kỳ</h3>
					<UBadge v-if="activeTickets.length > 0" color="neutral" variant="soft" size="sm">
						{{ activeTickets.length }}
					</UBadge>
				</div>

				<div v-if="activeTickets.length === 0" class="py-12 text-center">
					<UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mx-auto mb-2" />
					<p class="text-gray-400 text-sm">Không có yêu cầu nào trong khoảng thời gian này</p>
				</div>

				<div v-else class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
								<th class="px-4 py-3 text-left">Mã</th>
								<th class="px-4 py-3 text-left">Tiêu đề</th>
								<th class="px-4 py-3 text-left">Loại</th>
								<th class="px-4 py-3 text-left">Trạng thái</th>
								<th class="px-4 py-3 text-left">Cập nhật</th>
								<th class="px-4 py-3 text-right">Ngày mở</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							<tr
								v-for="ticket in activeTickets"
								:key="ticket.id"
								:class="[
									'cursor-pointer transition-colors',
									ticket.status === 'rejected' ? 'bg-red-50 hover:bg-red-100' :
									ticket.status === 'completed' ? 'bg-amber-50 hover:bg-amber-100' :
									'hover:bg-gray-50',
								]"
								@click="router.push(`/tickets/${ticket.id}`)"
							>
								<td class="px-4 py-3 font-mono text-green-700 font-medium">{{ ticket.code }}</td>
								<td class="px-4 py-3 text-gray-800 max-w-xs truncate">{{ ticket.title }}</td>
								<td class="px-4 py-3">
									<UBadge :color="getTypeColor(ticket.type)" variant="soft" size="sm">
										{{ getTypeLabel(ticket.type) }}
									</UBadge>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-1.5">
										<UBadge :color="getStatusColor(ticket.status)" variant="soft" size="sm">
											{{ getStatusLabel(ticket.status) }}
										</UBadge>
										<span v-if="ticket.status === 'rejected'" class="text-red-500 text-xs font-medium">← Cần gửi lại</span>
										<span v-if="ticket.status === 'completed'" class="text-amber-600 text-xs font-medium">← Cần nghiệm thu</span>
									</div>
								</td>
								<td class="px-4 py-3 text-gray-500">{{ formatDate(ticket.updatedAt) }}</td>
								<td class="px-4 py-3 text-right text-gray-600 font-medium">{{ ticket.daysOpen }}d</td>
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

	const { data, pending, refresh } = useAsyncData('dashboard-requester', () =>
		$fetch('/api/dashboard/requester', {
			query: { from: dateRange.value.from, to: dateRange.value.to },
		}),
	);

	watch(dateRange, () => {
		if (dateRange.value.from && dateRange.value.to) refresh();
	}, { deep: true });

	const dataKey = ref(0);
	watch(data, () => { dataKey.value++; });

	const dashData = computed(() => (data.value as any)?.data);
	const stats = computed(() => dashData.value?.stats);
	const activeTickets = computed<any[]>(() => dashData.value?.activeTickets ?? []);

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

	const TYPE_LABELS = ['Xử lý vận hành', 'Thay đổi & Tối ưu', 'Trích xuất dữ liệu', 'Phát triển tính năng'];

	const monthlyDatasets = computed(() => [{
		label: 'Số yêu cầu',
		data: dashData.value?.monthlyTrend?.data ?? [],
		color: '#10b981',
	}]);

	const typeDatasets = computed(() => [{
		label: 'Số yêu cầu',
		data: [1, 2, 3, 4].map(t => {
			const row = dashData.value?.typeBreakdown?.find((r: any) => r.type === t);
			return row?.count ?? 0;
		}),
		color: '#10b981',
	}]);

	const resolutionDatasets = computed(() => [{
		label: 'Ngày trung bình',
		data: [1, 2, 3, 4].map(t => {
			const row = dashData.value?.avgResolutionTime?.find((r: any) => r.type === t);
			return row?.avgDays ?? 0;
		}),
		color: '#3b82f6',
	}]);

	const getTypeColor = (type: number) => ['success', 'warning', 'info', 'secondary'][type - 1] || 'neutral';
	const getTypeLabel = (type: number) => TYPE_LABELS[type - 1] || `Loại ${type}`;
	const getStatusColor = (status: string) => {
		const map: Record<string, string> = {
			draft: 'neutral', pending_review: 'info', in_review: 'secondary',
			pending_approval: 'warning', approved: 'success', in_progress: 'warning',
			completed: 'success', accepted: 'success', rejected: 'error', cancelled: 'error',
		};
		return map[status] || 'neutral';
	};
	const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;
	const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
</script>
