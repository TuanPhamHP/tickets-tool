<template>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="flex-1">
				<h2 class="text-xl font-bold text-gray-900">Tổng quan công việc thực hiện</h2>
				<p class="text-sm text-gray-500 mt-0.5">Theo dõi tiến độ và khối lượng công việc</p>
			</div>
			<DashboardDatePicker v-model="dateRange" />
		</div>

		<!-- Stat Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
			<DashboardStatCard
				title="Đang thực hiện"
				:value="stats?.activeWorkload?.value ?? 0"
				icon="i-heroicons-arrow-path"
				highlight="blue"
				subtitle="Yêu cầu đang xử lý"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Hàng chờ"
				:value="stats?.incomingQueue?.value ?? 0"
				icon="i-heroicons-inbox-arrow-down"
				:highlight="(stats?.incomingQueue?.value ?? 0) > 0 ? 'amber' : undefined"
				subtitle="Đã duyệt, chưa bắt đầu"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Chờ nghiệm thu"
				:value="stats?.pendingAcceptance?.value ?? 0"
				icon="i-heroicons-clock"
				subtitle="Đã hoàn tất, chờ khách hàng"
				:loading="pending"
			/>
			<DashboardStatCard
				title="Bàn giao trong kỳ"
				:value="stats?.deliveredThisMonth?.value ?? 0"
				:previous-value="stats?.deliveredThisMonth?.previousValue"
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
				<DashboardChartsBarChart
					:key="'workload-' + dataKey"
					title="Khối lượng công việc đang thực hiện (theo loại)"
					:labels="TYPE_LABELS"
					:datasets="workloadDatasets"
					:horizontal="true"
					:height="260"
				/>
				<DashboardChartsLineChart
					:key="'throughput-' + dataKey"
					title="Năng suất hàng tuần (số yêu cầu hoàn tất)"
					:labels="dashData?.weeklyThroughput?.labels ?? []"
					:datasets="throughputDatasets"
					:fill="true"
					:height="260"
				/>
			</div>

			<!-- Charts row 2 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<DashboardChartsBarChart
					:key="'cycle-' + dataKey"
					title="Thời gian xử lý trung bình (ngày) — Bắt đầu đến Hoàn tất"
					:labels="TYPE_LABELS"
					:datasets="cycleDatasets"
					:height="240"
				/>
				<DashboardChartsBarChart
					:key="'pipeline-' + dataKey"
					title="Pipeline yêu cầu theo trạng thái"
					:labels="PIPELINE_LABELS"
					:datasets="pipelineDatasets"
					:height="240"
				/>
			</div>

			<!-- Current Workload Table -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
					<UIcon name="i-heroicons-clipboard-document-list" class="text-blue-500" />
					<h3 class="font-semibold text-gray-800">Danh sách công việc hiện tại</h3>
					<UBadge v-if="workloadTable.length > 0" color="info" variant="soft" size="sm">
						{{ workloadTable.length }}
					</UBadge>
				</div>

				<div v-if="workloadTable.length === 0" class="py-12 text-center">
					<UIcon name="i-heroicons-check-badge" class="text-4xl text-green-400 mx-auto mb-2" />
					<p class="text-gray-400 text-sm">Không có yêu cầu nào đang xử lý</p>
				</div>

				<div v-else class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
								<th class="px-4 py-3 text-left">Mã</th>
								<th class="px-4 py-3 text-left">Tiêu đề</th>
								<th class="px-4 py-3 text-left">Loại</th>
								<th class="px-4 py-3 text-left">Phòng ban</th>
								<th class="px-4 py-3 text-left">Trạng thái</th>
								<th class="px-4 py-3 text-right">Ngày thực hiện</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							<tr
								v-for="ticket in workloadTable"
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
								<td class="px-4 py-3">
									<UBadge :color="getStatusColor(ticket.status)" variant="soft" size="sm">
										{{ getStatusLabel(ticket.status) }}
									</UBadge>
								</td>
								<td class="px-4 py-3 text-right">
									<span v-if="ticket.daysInProgress !== null" :class="[
										'inline-flex items-center justify-center px-2 h-6 rounded-full text-xs font-bold',
										ticket.daysInProgress > 7 ? 'bg-red-100 text-red-700' :
										ticket.daysInProgress > 3 ? 'bg-amber-100 text-amber-700' :
										'bg-gray-100 text-gray-600',
									]">{{ ticket.daysInProgress }}d</span>
									<span v-else class="text-gray-400">-</span>
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

	const { data, pending, refresh } = useAsyncData('dashboard-implementer', () =>
		$fetch('/api/dashboard/implementer', {
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
	const workloadTable = computed<any[]>(() => dashData.value?.workloadTable ?? []);

	const TYPE_LABELS = ['Xử lý vận hành', 'Thay đổi & Tối ưu', 'Trích xuất dữ liệu', 'Phát triển tính năng'];
	const PIPELINE_LABELS = ['Đã duyệt', 'Đang thực hiện', 'Hoàn tất', 'Đã nghiệm thu'];

	const workloadDatasets = computed(() => [{
		label: 'Số yêu cầu',
		data: dashData.value?.workloadByType?.map((r: any) => r.count) ?? [0, 0, 0, 0],
		color: '#3b82f6',
	}]);

	const throughputDatasets = computed(() => [{
		label: 'Hoàn tất',
		data: dashData.value?.weeklyThroughput?.data ?? [],
		color: '#10b981',
	}]);

	const cycleDatasets = computed(() => [{
		label: 'Ngày trung bình',
		data: [1, 2, 3, 4].map(t => {
			const row = dashData.value?.cycleTimeByType?.find((r: any) => r.type === t);
			return row?.avgDays ?? 0;
		}),
		color: '#f59e0b',
	}]);

	const pipelineDatasets = computed(() => [{
		label: 'Số yêu cầu',
		data: dashData.value?.statusPipeline?.map((r: any) => r.count) ?? [0, 0, 0, 0],
		color: '#10b981',
	}]);

	const STATUS_LABELS: Record<string, string> = {
		approved: 'Đã duyệt', in_progress: 'Đang thực hiện',
		completed: 'Hoàn tất', accepted: 'Đã nghiệm thu',
	};

	const getTypeColor = (type: number) => ['success', 'warning', 'info', 'secondary'][type - 1] || 'neutral';
	const getTypeLabel = (type: number) => TYPE_LABELS[type - 1] || `Loại ${type}`;
	const getStatusColor = (status: string) => {
		const map: Record<string, string> = {
			approved: 'success', in_progress: 'info', completed: 'success', accepted: 'success',
		};
		return map[status] || 'neutral';
	};
	const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;
</script>
