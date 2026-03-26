<template>
	<div class="max-w-2xl mx-auto space-y-4">
		<!-- Page header -->
		<div class="flex items-center gap-3">
			<UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="navigateTo('/tickets')" />
			<div>
				<h2 class="text-xl font-bold text-gray-900">Tạo yêu cầu mới</h2>
				<p class="text-sm text-gray-500">Điền thông tin để tạo yêu cầu</p>
			</div>
		</div>

		<!-- Form card -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<UForm :state="form" class="space-y-5" @submit.prevent>
				<!-- Tiêu đề -->
				<UFormField label="Tiêu đề" name="title" required>
					<UInput
						v-model="form.title"
						placeholder="Nhập tiêu đề yêu cầu..."
						class="w-full"
						:class="{ 'ring-2 ring-red-500': submitted && !form.title }"
					/>
					<p v-if="submitted && !form.title" class="text-xs text-red-500 mt-1">Tiêu đề không được để trống</p>
				</UFormField>

				<!-- Loại yêu cầu -->
				<UFormField label="Loại yêu cầu" name="type" required>
					<USelect
						v-model="form.type"
						:items="typeOptions"
						placeholder="Chọn loại yêu cầu"
						class="w-full"
						:class="{ 'ring-2 ring-red-500': submitted && !form.type }"
					/>
					<p v-if="submitted && !form.type" class="text-xs text-red-500 mt-1">Vui lòng chọn loại yêu cầu</p>
					<p v-if="form.type" class="text-xs text-green-500 mt-1 text-semibold">{{ ticketTypeDesc }}</p>
				</UFormField>

				<!-- Mô tả -->
				<UFormField label="Mô tả" name="description">
					<MarkdownEditor
						v-model="form.description"
						placeholder="Mô tả chi tiết yêu cầu... (hỗ trợ Markdown)"
						:rows="6"
						class="w-full"
					/>
				</UFormField>

				<!-- Ưu tiên -->
				<UFormField label="Ưu tiên" name="priority">
					<USelect v-model="form.priority" :items="priorityOptions" placeholder="Chọn mức ưu tiên" class="w-full" />
				</UFormField>

				<!-- Phòng ban -->
				<UFormField label="Phòng ban" name="department_id">
					<USelect
						v-model="form.department_id"
						:items="departmentOptions"
						placeholder="Chọn phòng ban"
						class="w-full"
						:loading="loadingDepts"
					/>
				</UFormField>

				<!-- Nền tảng / Hệ thống -->
				<UFormField label="Nền tảng / Hệ thống" name="platformIds">
					<div class="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
						<UCheckbox
							v-for="opt in PLATFORM_OPTIONS"
							:key="opt.value"
							:id="'platform-' + opt.value"
							:model-value="form.platformIds.includes(opt.value)"
							:label="opt.label"
							@update:model-value="(v) => togglePlatform(form.platformIds, opt.value, v)"
						/>
					</div>
				</UFormField>

				<!-- Deadline -->
				<UFormField label="Deadline" name="deadline">
					<UInput v-model="form.deadline" type="date" class="w-full" />
				</UFormField>

				<!-- Actions -->
				<div class="flex items-center gap-3 pt-2">
					<UButton variant="outline" color="neutral" :loading="savingDraft" @click="saveDraft">
						<UIcon name="i-heroicons-document" class="mr-1" />
						Lưu nháp
					</UButton>
					<UButton
						:loading="submitting"
						style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
						class="text-white"
						@click="submitTicket"
					>
						<UIcon name="i-heroicons-paper-airplane" class="mr-1" />
						Nộp yêu cầu
					</UButton>
				</div>
			</UForm>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useCustomToast } from '~/composable/useCustomToast';
	import { PLATFORM_OPTIONS } from '~/utils/platforms';

	definePageMeta({ layout: 'default' });

	import { useAuthStore } from '~/store/auth';

	const { $api } = useNuxtApp();
	const { successToast, errorToast } = useCustomToast();
	const router = useRouter();
	const authStore = useAuthStore();

	const form = reactive({
		title: '',
		type: null as string | null,
		description: '',
		priority: 'medium',
		department_id: null as string | null,
		platformIds: [] as string[],
		deadline: '',
	});

	const togglePlatform = (list: string[], value: string, checked: boolean) => {
		if (checked) { if (!list.includes(value)) list.push(value); }
		else { const i = list.indexOf(value); if (i > -1) list.splice(i, 1); }
	};

	const submitted = ref(false);
	const savingDraft = ref(false);
	const submitting = ref(false);
	const loadingDepts = ref(false);
	const departments = ref<any[]>([]);

	const typeOptions = [
		{ label: 'Xử lý vận hành', value: '1' },
		{ label: 'Thay đổi và tối ưu', value: '2' },
		{ label: 'Trích xuất dữ liệu (xây module)', value: '3' },
		{ label: 'Phát triển tính năng mới', value: '4' },
	];

	const priorityOptions = [
		{ label: 'Thấp', value: 'low', icon: 'i-heroicons-arrow-down' },
		{ label: 'Trung bình', value: 'medium', icon: 'i-heroicons-minus' },
		{ label: 'Cao', value: 'high', icon: 'i-heroicons-arrow-up' },
		{ label: 'Khẩn cấp', value: 'urgent', icon: 'i-heroicons-bolt' },
	];

	const departmentOptions = computed(() => [
		{ label: 'Không chọn', value: null },
		...departments.value.map((d: any) => ({ label: d.name, value: String(d.id) })),
	]);

	const ticketTypeDesc = computed(() => {
		switch (form.type) {
			case '1':
				return "* Yêu cầu 'Xử lý vận hành' sẽ được duyệt tự động, không cần phê duyệt";
			case '2':
				return "* Yêu cầu 'Thay đổi và tối ưu' sẽ cần phê duyệt trước khi thực hiện";
			case '3':
				return "* Yêu cầu 'Trích xuất dữ liệu' sẽ cần phê duyệt trước khi thực hiện";
			case '4':
				return "* Yêu cầu 'Phát triển tính năng mới' sẽ cần phê duyệt trước khi thực hiện";
			default:
				return '';
		}
	});

	const fetchDepartments = async () => {
		loadingDepts.value = true;
		try {
			const res = (await $api.department.getList()) as any;
			departments.value = res?.data?.departments || res?.data || [];

			// Auto-fill phòng ban theo user hiện tại nếu hợp lệ
			const userDeptId = (authStore.user as any)?.departmentId;
			if (userDeptId) {
				const match = departments.value.find((d: any) => d.id === userDeptId);
				if (match) form.department_id = String(match.id);
			}
		} catch {
			// silently fail
		} finally {
			loadingDepts.value = false;
		}
	};

	const validateForm = () => {
		submitted.value = true;
		return !!(form.title && form.type);
	};

	const saveDraft = async () => {
		if (!validateForm()) return;
		savingDraft.value = true;
		try {
			const payload = {
				...form,
				status: 'draft',
				type: Number(form.type),
				departmentId: form.department_id ? Number(form.department_id) : null,
			};
			const res = (await $api.ticket.create(payload)) as any;
			const id = res?.data?.ticket?.id || res?.data?.id;
			successToast({ title: 'Lưu nháp thành công' });
			router.push(`/tickets/${id}`);
		} catch (err: any) {
			console.log(err);
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể lưu nháp' });
		} finally {
			savingDraft.value = false;
		}
	};

	const submitTicket = async () => {
		if (!validateForm()) return;
		submitting.value = true;
		try {
			const payload = {
				...form,
				type: Number(form.type),
				departmentId: form.department_id ? Number(form.department_id) : null,
			};
			const res = (await $api.ticket.create(payload)) as any;
			const ticket = res?.data?.ticket || res?.data || null;
			const ticketId = ticket?.id;

			// Auto-submit after create → chuyển sang pending_review
			if (ticketId) {
				await $api.ticket.submit(ticketId);
			}

			successToast({ title: 'Nộp yêu cầu thành công' });
			router.push(`/tickets/${ticketId}`);
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể nộp yêu cầu' });
		} finally {
			submitting.value = false;
		}
	};

	onMounted(() => {
		fetchDepartments();
	});
</script>
