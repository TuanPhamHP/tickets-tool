<template>
	<div class="space-y-4">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-gray-900">Yêu cầu</h2>
				<p class="text-sm text-gray-500 mt-0.5">Quản lý tất cả yêu cầu của bạn</p>
			</div>
			<UButton
				v-if="canCreate"
				icon="i-heroicons-plus"
				style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
				class="text-white"
				@click="navigateTo('/tickets/create')"
			>
				Tạo yêu cầu
			</UButton>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
			<!-- Status tabs -->
			<div class="flex flex-wrap gap-2">
				<button
					v-for="tab in statusTabs"
					:key="tab.value"
					:class="[
						'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
						activeStatus === tab.value ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
					]"
					:style="activeStatus === tab.value ? 'background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)' : ''"
					@click="activeStatus = tab.value"
				>
					{{ tab.label }}
				</button>
			</div>

			<!-- Search and type filter -->
			<div class="flex flex-wrap gap-3">
				<UInput
					v-model="searchQuery"
					placeholder="Tìm kiếm tiêu đề..."
					icon="i-heroicons-magnifying-glass"
					class="flex-1 min-w-[200px]"
					@input="debouncedFetch"
				/>
				<USelect
					v-model="typeFilter"
					:items="typeOptions"
					placeholder="Loại yêu cầu"
					class="w-48"
					@update:model-value="fetchTickets"
				/>
			</div>
		</div>

		<!-- Table -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<UTable :data="tickets" :columns="columns" :loading="loading" class="w-full" @select="onRowClick">
				<template #code-cell="{ row }">
					<span class="font-mono text-sm font-medium text-green-700">{{
						row.original.ticket.code || `#${row.original.id}`
					}}</span>
				</template>

				<template #title-cell="{ row }">
					<span class="font-medium text-gray-900 line-clamp-1 max-w-xs">{{ row.original.ticket.title }}</span>
				</template>

				<template #type-cell="{ row }">
					<UBadge :color="getTypeColor(row.original.ticket.type)" variant="soft" size="sm">
						{{ getTypeLabel(row.original.ticket.type) }}
					</UBadge>
				</template>

				<template #status-cell="{ row }">
					<UBadge :color="getStatusColor(row.original.ticket.status)" variant="soft" size="sm">
						{{ getStatusLabel(row.original.ticket.status) }}
					</UBadge>
				</template>

				<template #priority-cell="{ row }">
					<UBadge :color="getPriorityColor(row.original.ticket.priority)" variant="soft" size="sm">
						{{ getPriorityLabel(row.original.ticket.priority) }}
					</UBadge>
				</template>

				<template #requester-cell="{ row }">
					<span class="text-sm text-gray-700">{{
						row.original.requester?.name || row.original.requester_name || '-'
					}}</span>
				</template>

				<template #created_at-cell="{ row }">
					<span class="text-sm text-gray-500">{{ formatDate(row.original.ticket.createdAt) }}</span>
				</template>

				<template #actions-cell="{ row }">
					<UButton
						variant="ghost"
						color="neutral"
						icon="i-heroicons-eye"
						size="xs"
						@click.stop="navigateTo(`/tickets/${row.original.ticket.id}`)"
					/>
				</template>
			</UTable>

			<!-- Empty state -->
			<div v-if="!loading && tickets.length === 0" class="py-16 text-center">
				<UIcon name="i-heroicons-inbox" class="text-5xl text-gray-300 mx-auto mb-3" />
				<p class="text-gray-500">Không có yêu cầu nào</p>
			</div>
		</div>

		<!-- Pagination -->
		<div v-if="totalItems > itemsPerPage" class="flex justify-center">
			<UPagination
				v-model:page="currentPage"
				:total="totalItems"
				:items-per-page="itemsPerPage"
				@update:page="fetchTickets"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAuthStore } from '~/store/auth';
	import { storeToRefs } from 'pinia';
	import { useCustomToast } from '~/composable/useCustomToast';

	definePageMeta({ layout: 'default' });

	const { $api } = useNuxtApp();
	const authStore = useAuthStore();
	const { user } = storeToRefs(authStore);
	const { errorToast } = useCustomToast();
	const router = useRouter();

	// State
	const tickets = ref<any[]>([]);
	const loading = ref(false);
	const totalItems = ref(0);
	const currentPage = ref(1);
	const itemsPerPage = ref(15);
	const searchQuery = ref('');
	const activeStatus = ref('all');
	const typeFilter = ref<string | null>(null);

	// Computed
	const canCreate = computed(() => {
		const u = user.value as any;
		return ['admin', 'requester'].includes(u?.role);
	});

	// Status tabs
	const statusTabs = [
		{ value: 'all', label: 'Tất cả' },
		{ value: 'draft', label: 'Nháp' },
		{ value: 'pending_approval', label: 'Chờ duyệt' },
		{ value: 'approved', label: 'Đã duyệt' },
		{ value: 'in_progress', label: 'Đang thực hiện' },
		{ value: 'completed', label: 'Hoàn tất' },
		{ value: 'accepted', label: 'Đã nghiệm thu' },
		{ value: 'rejected', label: 'Từ chối' },
	];

	const typeOptions = [
		{ label: 'Tất cả loại', value: null },
		{ label: 'Vận hành', value: '1' },
		{ label: 'Thay đổi', value: '2' },
		{ label: 'Phát triển', value: '3' },
	];

	// Table columns
	const columns = [
		{ accessorKey: 'code', header: 'Mã' },
		{ accessorKey: 'title', header: 'Tiêu đề' },
		{ accessorKey: 'type', header: 'Loại' },
		{ accessorKey: 'status', header: 'Trạng thái' },
		{ accessorKey: 'priority', header: 'Ưu tiên' },
		{ accessorKey: 'requester', header: 'Người yêu cầu' },
		{ accessorKey: 'created_at', header: 'Ngày tạo' },
		{ id: 'actions', header: '' },
	];

	// Helpers
	const getStatusColor = (status: string) => {
		const map: Record<string, string> = {
			draft: 'neutral',
			pending_approval: 'warning',
			approved: 'info',
			in_progress: 'warning',
			completed: 'success',
			accepted: 'success',
			rejected: 'error',
		};
		return map[status] || 'neutral';
	};

	const getStatusLabel = (status: string) => {
		const map: Record<string, string> = {
			draft: 'Nháp',
			pending_approval: 'Chờ duyệt',
			approved: 'Đã duyệt',
			in_progress: 'Đang thực hiện',
			completed: 'Hoàn tất',
			accepted: 'Đã nghiệm thu',
			rejected: 'Từ chối',
		};
		return map[status] || status;
	};

	const getTypeColor = (typeId: number | string) => {
		const map: Record<string, string> = {
			'1': 'success',
			'2': 'warning',
			'3': 'secondary',
		};
		return map[String(typeId)] || 'neutral';
	};

	const getTypeLabel = (typeId: number | string) => {
		const map: Record<string, string> = {
			'1': 'Vận hành',
			'2': 'Thay đổi',
			'3': 'Phát triển',
		};
		return map[String(typeId)] || `Loại ${typeId}`;
	};

	const getPriorityColor = (priority: string) => {
		const map: Record<string, string> = {
			low: 'neutral',
			medium: 'info',
			high: 'warning',
			urgent: 'error',
		};
		return map[priority] || 'neutral';
	};

	const getPriorityLabel = (priority: string) => {
		const map: Record<string, string> = {
			low: 'Thấp',
			medium: 'Trung bình',
			high: 'Cao',
			urgent: 'Khẩn cấp',
		};
		return map[priority] || priority;
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('vi-VN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	// Data fetching
	const fetchTickets = async () => {
		loading.value = true;
		try {
			const params: Record<string, any> = {
				page: currentPage.value,
				limit: itemsPerPage.value,
			};
			if (activeStatus.value !== 'all') params.status = activeStatus.value;
			if (searchQuery.value) params.search = searchQuery.value;
			if (typeFilter.value) params.type = typeFilter.value;

			const res = (await $api.ticket.getList(params)) as any;
			tickets.value = res?.data?.tickets || res?.data?.data || res?.data || [];
			totalItems.value = res?.data?.meta?.total || res?.data?.total || tickets.value.length;
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể tải danh sách yêu cầu' });
		} finally {
			loading.value = false;
		}
	};

	// Debounced search
	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	const debouncedFetch = () => {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			currentPage.value = 1;
			fetchTickets();
		}, 400);
	};

	// Watch status change
	watch(activeStatus, () => {
		currentPage.value = 1;
		fetchTickets();
	});

	const onRowClick = (row: any) => {
		const id = row?.original?.ticket?.id || row?.id;
		if (id) router.push(`/tickets/${id}`);
	};

	onMounted(() => {
		fetchTickets();
	});
</script>
