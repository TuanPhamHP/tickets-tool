<template>
	<div class="space-y-4">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-gray-900">Phòng ban</h2>
				<p class="text-sm text-gray-500 mt-0.5">Quản lý danh sách phòng ban</p>
			</div>
			<UButton
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
				placeholder="Tìm kiếm phòng ban..."
				icon="i-heroicons-magnifying-glass"
				class="max-w-sm"
				@input="debouncedFetch"
			/>
		</div>

		<!-- Table -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<UTable
				:data="filteredDepartments"
				:columns="columns"
				:loading="loading"
				class="w-full"
			>
				<template #name-cell="{ row }">
					<span class="font-medium text-gray-900">{{ row.original.name }}</span>
				</template>

				<template #company-cell="{ row }">
					<span class="text-sm text-gray-600">{{ row.original.company || row.original.company_name || '-' }}</span>
				</template>

				<template #created_at-cell="{ row }">
					<span class="text-sm text-gray-500">{{ formatDate(row.original.created_at) }}</span>
				</template>

				<template #actions-cell="{ row }">
					<UButton
						variant="ghost"
						color="neutral"
						icon="i-heroicons-pencil"
						size="xs"
						@click="openEditModal(row.original)"
					/>
				</template>
			</UTable>

			<div v-if="!loading && filteredDepartments.length === 0" class="py-16 text-center">
				<UIcon name="i-heroicons-building-office-2" class="text-5xl text-gray-300 mx-auto mb-3" />
				<p class="text-gray-500">Không có phòng ban nào</p>
			</div>
		</div>

		<!-- Create/Edit Modal -->
		<UModal v-model:open="modalOpen">
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

						<UFormField label="Công ty" name="company" required>
							<UInput
								v-model="form.company"
								placeholder="Nhập tên công ty"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.company }"
							/>
							<p v-if="formSubmitted && !form.company" class="text-xs text-red-500 mt-1">Công ty không được để trống</p>
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

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { successToast, errorToast } = useCustomToast();
const router = useRouter();

// Guard: admin only
onMounted(async () => {
	const role = (user.value as any)?.role;
	if (role !== 'admin') {
		router.push('/tickets');
		return;
	}
	await fetchDepartments();
});

const departments = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const modalOpen = ref(false);
const editingDept = ref<any>(null);
const saving = ref(false);
const formSubmitted = ref(false);

const form = reactive({
	name: '',
	company: '',
});

const columns = [
	{ accessorKey: 'name', header: 'Tên phòng ban' },
	{ accessorKey: 'company', header: 'Công ty' },
	{ accessorKey: 'created_at', header: 'Ngày tạo' },
	{ id: 'actions', header: '' },
];

const filteredDepartments = computed(() => {
	if (!searchQuery.value) return departments.value;
	const q = searchQuery.value.toLowerCase();
	return departments.value.filter(
		d => d.name?.toLowerCase().includes(q) || d.company?.toLowerCase().includes(q) || d.company_name?.toLowerCase().includes(q)
	);
});

const formatDate = (dateStr: string) => {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fetchDepartments = async () => {
	loading.value = true;
	try {
		const res = await $api.department.getList() as any;
		departments.value = res?.data?.departments || res?.data || [];
	} catch (err: any) {
		errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể tải danh sách phòng ban' });
	} finally {
		loading.value = false;
	}
};

let searchTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedFetch = () => {
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => fetchDepartments(), 400);
};

const openCreateModal = () => {
	editingDept.value = null;
	form.name = '';
	form.company = '';
	formSubmitted.value = false;
	modalOpen.value = true;
};

const openEditModal = (dept: any) => {
	editingDept.value = dept;
	form.name = dept.name || '';
	form.company = dept.company || dept.company_name || '';
	formSubmitted.value = false;
	modalOpen.value = true;
};

const closeModal = () => {
	modalOpen.value = false;
	editingDept.value = null;
};

const saveDepartment = async () => {
	formSubmitted.value = true;
	if (!form.name || !form.company) return;

	saving.value = true;
	try {
		if (editingDept.value) {
			await $api.department.update(editingDept.value.id, { name: form.name, company: form.company });
			successToast({ title: 'Cập nhật phòng ban thành công' });
		} else {
			await $api.department.create({ name: form.name, company: form.company });
			successToast({ title: 'Thêm phòng ban thành công' });
		}
		closeModal();
		await fetchDepartments();
	} catch (err: any) {
		errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể lưu phòng ban' });
	} finally {
		saving.value = false;
	}
};
</script>
