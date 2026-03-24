<template>
	<div class="space-y-4">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-gray-900">Phòng ban</h2>
				<p class="text-sm text-gray-500 mt-0.5">Quản lý danh sách phòng ban</p>
			</div>
			<UButton
				v-if="isAdmin"
				icon="i-heroicons-plus"
				style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
				class="text-white"
				@click="openCreateModal"
			>
				Thêm phòng ban
			</UButton>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<UInput
				v-model="searchQuery"
				placeholder="Tìm kiếm theo tên phòng ban..."
				icon="i-heroicons-magnifying-glass"
				class="max-w-sm"
				@update:model-value="debouncedSearch"
			/>
		</div>

		<!-- Table -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<UTable
				:data="departments"
				:columns="columns"
				:loading="loading"
				class="w-full"
			>
				<template #name-cell="{ row }">
					<span class="font-medium text-gray-900">{{ row.original.name }}</span>
				</template>

				<template #company-cell="{ row }">
					<span class="text-sm text-gray-600">{{ row.original.company || '-' }}</span>
				</template>

				<template #description-cell="{ row }">
					<span class="text-sm text-gray-500 line-clamp-1">{{ row.original.description || '-' }}</span>
				</template>

				<template #createdAt-cell="{ row }">
					<span class="text-sm text-gray-500">{{ formatDate(row.original.createdAt) }}</span>
				</template>

				<template #actions-cell="{ row }">
					<div class="flex items-center gap-1">
						<UButton
							variant="ghost"
							color="neutral"
							icon="i-heroicons-eye"
							size="xs"
							@click="openDetailModal(row.original)"
						/>
						<UButton
							v-if="isAdmin"
							variant="ghost"
							color="neutral"
							icon="i-heroicons-pencil"
							size="xs"
							@click="openEditModal(row.original)"
						/>
					</div>
				</template>
			</UTable>

			<div v-if="!loading && departments.length === 0" class="py-16 text-center">
				<UIcon name="i-heroicons-building-office-2" class="text-5xl text-gray-300 mx-auto mb-3" />
				<p class="text-gray-500">Không có phòng ban nào</p>
			</div>
		</div>

		<!-- Detail Modal -->
		<UModal v-model:open="detailOpen" :ui="{ content: 'max-w-2xl' }">
			<template #content>
				<UCard>
					<template #header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
									<UIcon name="i-heroicons-building-office-2" class="text-green-700 text-base" />
								</div>
								<div>
									<h3 class="text-base font-semibold text-gray-900">{{ detailDept?.name }}</h3>
									<p class="text-xs text-gray-500">{{ detailDept?.company }}</p>
								</div>
							</div>
							<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="detailOpen = false" />
						</div>
					</template>

					<div class="space-y-5">
						<!-- Department info -->
						<div v-if="detailDept?.description" class="p-3 rounded-lg bg-gray-50 border border-gray-100">
							<p class="text-xs text-gray-500 mb-1">Mô tả</p>
							<p class="text-sm text-gray-700">{{ detailDept.description }}</p>
						</div>

						<!-- User list -->
						<div>
							<div class="flex items-center justify-between mb-3">
								<p class="text-sm font-semibold text-gray-800">
									Thành viên
									<span class="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
										{{ detailUsers.length }}
									</span>
								</p>
							</div>

							<div v-if="detailLoading" class="py-8 flex justify-center">
								<UIcon name="i-heroicons-arrow-path" class="text-2xl text-gray-400 animate-spin" />
							</div>

							<div v-else-if="detailUsers.length === 0" class="py-8 text-center">
								<UIcon name="i-heroicons-users" class="text-4xl text-gray-300 mx-auto mb-2" />
								<p class="text-sm text-gray-500">Chưa có thành viên nào</p>
							</div>

							<div v-else class="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
								<div
									v-for="u in detailUsers"
									:key="u.id"
									class="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
								>
									<!-- Avatar -->
									<div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
										:class="roleColor(u.role)"
									>
										{{ nameInitials(u.name) }}
									</div>

									<!-- Info -->
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<p class="text-sm font-medium text-gray-900 truncate">{{ u.name }}</p>
											<span
												class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
												:class="roleBadgeClass(u.role)"
											>
												{{ roleLabel(u.role) }}
											</span>
											<span v-if="!u.isActive" class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 flex-shrink-0">
												Vô hiệu
											</span>
										</div>
										<p class="text-xs text-gray-500 truncate">{{ u.email }}</p>
									</div>

									<!-- Phone -->
									<p v-if="u.phone" class="text-xs text-gray-500 flex-shrink-0">{{ u.phone }}</p>
								</div>
							</div>
						</div>
					</div>
				</UCard>
			</template>
		</UModal>

		<!-- Create/Edit Modal — chỉ admin mới thấy -->
		<UModal v-if="isAdmin" v-model:open="modalOpen">
			<template #content>
				<UCard>
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-base font-semibold">{{ editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban' }}</h3>
							<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="closeModal" />
						</div>
					</template>

					<UForm :state="form" class="space-y-4" @submit.prevent>
						<UFormField label="Tên phòng ban" name="name" required>
							<UInput
								v-model="form.name"
								placeholder="Nhập tên phòng ban"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.name }"
							/>
							<p v-if="formSubmitted && !form.name" class="text-xs text-red-500 mt-1">Tên phòng ban không được để trống</p>
						</UFormField>

						<UFormField label="Công ty" name="company">
							<UInput
								v-model="form.company"
								placeholder="Xuân Cương"
								class="w-full"
							/>
						</UFormField>

						<UFormField label="Mô tả" name="description">
							<UTextarea
								v-model="form.description"
								placeholder="Mô tả ngắn về phòng ban (tuỳ chọn)"
								:rows="3"
								class="w-full"
							/>
						</UFormField>
					</UForm>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton variant="outline" color="neutral" @click="closeModal">Huỷ</UButton>
							<UButton
								:loading="saving"
								style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
								class="text-white"
								@click="saveDepartment"
							>
								{{ editingDept ? 'Cập nhật' : 'Thêm mới' }}
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
import { storeToRefs } from 'pinia';
import { useCustomToast } from '~/composable/useCustomToast';

definePageMeta({ layout: 'default' });

const { $api } = useNuxtApp() as ReturnType<typeof useNuxtApp> & { $api: Record<string, any> };
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { successToast, errorToast } = useCustomToast();
const router = useRouter();

const isAdmin = computed(() => (user.value as any)?.role === 'admin');
const isAdminOrApprover = computed(() => ['admin', 'approver'].includes((user.value as any)?.role));

// Guard: admin hoặc approver mới được vào
onMounted(async () => {
	if (!isAdminOrApprover.value) {
		router.push('/tickets');
		return;
	}
	await fetchDepartments();
});

// ─── List ────────────────────────────────────────────────────────────────────

const departments = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');

const columns = computed(() => [
	{ accessorKey: 'name', header: 'Tên phòng ban' },
	{ accessorKey: 'company', header: 'Công ty' },
	{ accessorKey: 'description', header: 'Mô tả' },
	{ accessorKey: 'createdAt', header: 'Ngày tạo' },
	{ id: 'actions', header: '' },
]);

const formatDate = (dateStr: string) => {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fetchDepartments = async () => {
	loading.value = true;
	try {
		const res = await $api.department.getList({ search: searchQuery.value || undefined }) as any;
		departments.value = res?.data || [];
	} catch (err: unknown) {
		errorToast({ title: 'Lỗi', description: (err as any)?.data?.message || 'Không thể tải danh sách phòng ban' });
	} finally {
		loading.value = false;
	}
};

let searchTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => fetchDepartments(), 400);
};

// ─── Detail modal ─────────────────────────────────────────────────────────────

const detailOpen = ref(false);
const detailDept = ref<any>(null);
const detailUsers = ref<any[]>([]);
const detailLoading = ref(false);

const openDetailModal = async (dept: any) => {
	detailDept.value = dept;
	detailUsers.value = [];
	detailOpen.value = true;
	detailLoading.value = true;
	try {
		const res = await $api.department.getById(dept.id) as any;
		detailDept.value = res?.data ?? dept;
		detailUsers.value = res?.data?.users ?? [];
	} catch (err: unknown) {
		errorToast({ title: 'Lỗi', description: (err as any)?.data?.message || 'Không thể tải chi tiết phòng ban' });
	} finally {
		detailLoading.value = false;
	}
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roleLabel = (role: string) => {
	const map: Record<string, string> = {
		admin: 'Quản trị',
		requester: 'Người yêu cầu',
		approver: 'Phê duyệt',
		implementer: 'Thực hiện',
	};
	return map[role] ?? role;
};

const roleBadgeClass = (role: string) => ({
	'bg-purple-100 text-purple-700': role === 'admin',
	'bg-blue-100 text-blue-700': role === 'requester',
	'bg-amber-100 text-amber-700': role === 'approver',
	'bg-cyan-100 text-cyan-700': role === 'implementer',
});

const roleColor = (role: string) => ({
	'bg-purple-500': role === 'admin',
	'bg-blue-500': role === 'requester',
	'bg-amber-500': role === 'approver',
	'bg-cyan-500': role === 'implementer',
});

const nameInitials = (name: string) => {
	const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return 'U';
	if (words.length === 1) return words[0][0].toUpperCase();
	return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
};

// ─── Create / Edit modal ──────────────────────────────────────────────────────

const modalOpen = ref(false);
const editingDept = ref<any>(null);
const saving = ref(false);
const formSubmitted = ref(false);

const form = reactive({
	name: '',
	company: 'Xuân Cương',
	description: '',
});

const openCreateModal = () => {
	editingDept.value = null;
	form.name = '';
	form.company = 'Xuân Cương';
	form.description = '';
	formSubmitted.value = false;
	modalOpen.value = true;
};

const openEditModal = (dept: any) => {
	editingDept.value = dept;
	form.name = dept.name || '';
	form.company = dept.company || 'Xuân Cương';
	form.description = dept.description || '';
	formSubmitted.value = false;
	modalOpen.value = true;
};

const closeModal = () => {
	modalOpen.value = false;
	editingDept.value = null;
};

const saveDepartment = async () => {
	formSubmitted.value = true;
	if (!form.name) return;

	saving.value = true;
	try {
		const payload = {
			name: form.name,
			company: form.company || 'Xuân Cương',
			description: form.description || null,
		};
		if (editingDept.value) {
			await $api.department.update(editingDept.value.id, payload);
			successToast({ title: 'Cập nhật phòng ban thành công' });
		} else {
			await $api.department.create(payload);
			successToast({ title: 'Thêm phòng ban thành công' });
		}
		closeModal();
		await fetchDepartments();
	} catch (err: unknown) {
		errorToast({ title: 'Lỗi', description: (err as any)?.data?.message || 'Không thể lưu phòng ban' });
	} finally {
		saving.value = false;
	}
};
</script>
