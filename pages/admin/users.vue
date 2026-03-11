<template>
	<div class="space-y-4">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-gray-900">Nhân sự</h2>
				<p class="text-sm text-gray-500 mt-0.5">Quản lý tài khoản người dùng</p>
			</div>
			<UButton
				icon="i-heroicons-plus"
				style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
				class="text-white"
				@click="openCreateModal"
			>
				Thêm người dùng
			</UButton>
		</div>

		<!-- Filters -->
		<div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
			<UInput
				v-model="searchQuery"
				placeholder="Tìm kiếm tên, email..."
				icon="i-heroicons-magnifying-glass"
				class="flex-1 min-w-[200px]"
				@input="debouncedFetch"
			/>
			<USelect
				v-model="roleFilter"
				:items="roleFilterOptions"
				placeholder="Vai trò"
				class="w-44"
				@update:model-value="fetchUsers"
			/>
		</div>

		<!-- Table -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<UTable :data="users" :columns="columns" :loading="loading" class="w-full">
				<template #name-cell="{ row }">
					<div class="flex items-center gap-2">
						<UAvatar :alt="row.original.name || 'U'" size="sm" />
						<span class="font-medium text-gray-900">{{ row.original.name }}</span>
					</div>
				</template>

				<template #email-cell="{ row }">
					<span class="text-sm text-gray-600">{{ row.original.email }}</span>
				</template>

				<template #role-cell="{ row }">
					<UBadge :color="getRoleColor(row.original.role)" variant="soft" size="sm">
						{{ getRoleLabel(row.original.role) }}
					</UBadge>
				</template>

				<template #department-cell="{ row }">
					<span class="text-sm text-gray-600">{{
						row.original.department?.name || row.original.department_name || '-'
					}}</span>
				</template>

				<template #status-cell="{ row }">
					<UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="soft" size="sm">
						{{ row.original.isActive ? 'Hoạt động' : 'Vô hiệu' }}
					</UBadge>
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

			<div v-if="!loading && users.length === 0" class="py-16 text-center">
				<UIcon name="i-heroicons-users" class="text-5xl text-gray-300 mx-auto mb-3" />
				<p class="text-gray-500">Không có người dùng nào</p>
			</div>
		</div>

		<!-- Pagination -->
		<div v-if="totalItems > itemsPerPage" class="flex justify-center">
			<UPagination
				v-model:page="currentPage"
				:total="totalItems"
				:items-per-page="itemsPerPage"
				@update:page="fetchUsers"
			/>
		</div>

		<!-- Create/Edit Modal -->
		<UModal v-model:open="modalOpen">
			<template #content>
				<UCard class="max-h-[90vh] overflow-y-auto">
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-base font-semibold">{{ editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng' }}</h3>
							<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="closeModal" />
						</div>
					</template>

					<UForm :state="form" class="space-y-4" @submit.prevent>
						<UFormField label="Họ và tên" name="name" required>
							<UInput
								v-model="form.name"
								placeholder="Nhập họ và tên"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.name }"
							/>
							<p v-if="formSubmitted && !form.name" class="text-xs text-red-500 mt-1">Tên không được để trống</p>
						</UFormField>

						<UFormField label="Email" name="email" required>
							<UInput
								v-model="form.email"
								type="email"
								placeholder="email@xuancuong.vn"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.email }"
							/>
							<p v-if="formSubmitted && !form.email" class="text-xs text-red-500 mt-1">Email không được để trống</p>
						</UFormField>

						<!-- Password only for create -->
						<UFormField v-if="!editingUser" label="Mật khẩu" name="password" required>
							<UInput
								v-model="form.password"
								type="password"
								placeholder="Nhập mật khẩu"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.password }"
							/>
							<p v-if="formSubmitted && !form.password" class="text-xs text-red-500 mt-1">
								Mật khẩu không được để trống
							</p>
						</UFormField>

						<UFormField label="Vai trò" name="role" required>
							<USelect
								v-model="form.role"
								:items="roleOptions"
								placeholder="Chọn vai trò"
								class="w-full"
								:class="{ 'ring-2 ring-red-500': formSubmitted && !form.role }"
							/>
							<p v-if="formSubmitted && !form.role" class="text-xs text-red-500 mt-1">Vui lòng chọn vai trò</p>
						</UFormField>

						<UFormField label="Phòng ban" name="department_id">
							<USelect
								v-model="form.department_id"
								:items="departmentOptions"
								placeholder="Chọn phòng ban"
								class="w-full"
							/>
						</UFormField>

						<UFormField label="Công ty" name="company">
							<UInput v-model="form.company" placeholder="Tên công ty" class="w-full" />
						</UFormField>

						<UFormField label="Số điện thoại" name="phone">
							<UInput v-model="form.phone" placeholder="0909 xxx xxx" class="w-full" />
						</UFormField>

						<!-- Active toggle only for edit -->
						<div v-if="editingUser" class="flex items-center gap-3">
							<label class="text-sm font-medium text-gray-700">Trạng thái</label>
							<input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-green-600" />
							<span class="text-sm text-gray-600">{{ form.is_active ? 'Hoạt động' : 'Vô hiệu' }}</span>
						</div>
					</UForm>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton variant="outline" color="neutral" @click="closeModal">Huỷ</UButton>
							<UButton
								:loading="saving"
								style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
								class="text-white"
								@click="saveUser"
							>
								{{ editingUser ? 'Cập nhật' : 'Thêm mới' }}
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
		await Promise.all([fetchUsers(), fetchDepartments()]);
	});

	const users = ref<any[]>([]);
	const departments = ref<any[]>([]);
	const loading = ref(false);
	const saving = ref(false);
	const totalItems = ref(0);
	const currentPage = ref(1);
	const itemsPerPage = ref(20);
	const searchQuery = ref('');
	const roleFilter = ref('');
	const modalOpen = ref(false);
	const editingUser = ref<any>(null);
	const formSubmitted = ref(false);

	const form = reactive({
		name: '',
		email: '',
		password: '',
		role: '',
		department_id: '',
		company: '',
		phone: '',
		is_active: true,
	});

	const columns = [
		{ accessorKey: 'name', header: 'Tên' },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'role', header: 'Vai trò' },
		{ accessorKey: 'department', header: 'Phòng ban' },
		{ id: 'status', header: 'Trạng thái' },
		{ id: 'actions', header: '' },
	];

	const roleOptions = [
		{ label: 'Quản trị viên', value: 'admin' },
		{ label: 'Người yêu cầu', value: 'requester' },
		{ label: 'Người phê duyệt', value: 'approver' },
		{ label: 'Người thực hiện', value: 'implementer' },
	];

	const roleFilterOptions = [{ label: 'Tất cả vai trò', value: null }, ...roleOptions];

	const departmentOptions = computed(() => [
		{ label: 'Không chọn', value: null },
		...departments.value.map((d: any) => ({ label: d.name, value: String(d.id) })),
	]);

	const getRoleColor = (role: string) => {
		const map: Record<string, string> = {
			admin: 'secondary',
			requester: 'info',
			approver: 'warning',
			implementer: 'success',
		};
		return map[role] || 'neutral';
	};

	const getRoleLabel = (role: string) => {
		const map: Record<string, string> = {
			admin: 'Admin',
			requester: 'Người yêu cầu',
			approver: 'Phê duyệt',
			implementer: 'Thực hiện',
		};
		return map[role] || role;
	};

	const fetchUsers = async () => {
		loading.value = true;
		try {
			const params: Record<string, any> = {
				page: currentPage.value,
				limit: itemsPerPage.value,
			};
			if (searchQuery.value) params.search = searchQuery.value;
			if (roleFilter.value) params.role = roleFilter.value;

			const res = (await $api.admin.getUsers(params)) as any;
			users.value = res?.data?.users || res?.data?.data || res?.data || [];
			totalItems.value = res?.data?.meta?.total || res?.data?.total || users.value.length;
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể tải danh sách người dùng' });
		} finally {
			loading.value = false;
		}
	};

	const fetchDepartments = async () => {
		try {
			const res = (await $api.department.getList()) as any;
			departments.value = res?.data?.departments || res?.data || [];
		} catch {
			// silently fail
		}
	};

	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	const debouncedFetch = () => {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			currentPage.value = 1;
			fetchUsers();
		}, 400);
	};

	const openCreateModal = () => {
		editingUser.value = null;
		form.name = '';
		form.email = '';
		form.password = '';
		form.role = '';
		form.department_id = '';
		form.company = '';
		form.phone = '';
		form.is_active = true;
		formSubmitted.value = false;
		modalOpen.value = true;
	};

	const openEditModal = (u: any) => {
		editingUser.value = u;
		form.name = u.name || '';
		form.email = u.email || '';
		form.password = '';
		form.role = u.role || '';
		form.department_id = u.department_id ? String(u.department_id) : '';
		form.company = u.company || '';
		form.phone = u.phone || '';
		form.is_active = u.is_active !== false;
		formSubmitted.value = false;
		modalOpen.value = true;
	};

	const closeModal = () => {
		modalOpen.value = false;
		editingUser.value = null;
	};

	const saveUser = async () => {
		formSubmitted.value = true;

		// Validate
		if (!form.name || !form.email || !form.role) return;
		if (!editingUser.value && !form.password) return;

		saving.value = true;
		try {
			const payload: Record<string, any> = {
				name: form.name,
				email: form.email,
				role: form.role,
				company: form.company,
				phone: form.phone,
			};
			if (form.department_id) payload.departmentId = Number(form.department_id);

			if (editingUser.value) {
				payload.isActive = form.is_active;
				await $api.admin.updateUser(editingUser.value.id, payload);
				successToast({ title: 'Cập nhật người dùng thành công' });
			} else {
				payload.password = form.password;
				await $api.admin.createUser(payload);
				successToast({ title: 'Thêm người dùng thành công' });
			}
			closeModal();
			await fetchUsers();
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể lưu người dùng' });
		} finally {
			saving.value = false;
		}
	};
</script>
