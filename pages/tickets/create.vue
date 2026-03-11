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
					<p v-if="form.type" class="text-xs text-grayscale-500 mt-1">{{ ticketTypeDesc }}</p>
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

	definePageMeta({ layout: 'default' });

	const { $api } = useNuxtApp();
	const { successToast, errorToast } = useCustomToast();
	const router = useRouter();

	const form = reactive({
		title: '',
		type: null as string | null,
		description: '',
		priority: 'medium',
		department_id: null as string | null,
		deadline: '',
	});

	const submitted = ref(false);
	const savingDraft = ref(false);
	const submitting = ref(false);
	const loadingDepts = ref(false);
	const departments = ref<any[]>([]);

	const typeOptions = [
		{ label: 'Vận hành', value: '1' },
		{ label: 'Thay đổi', value: '2' },
		{ label: 'Phát triển', value: '3' },
	];

	const priorityOptions = [
		{ label: 'Thấp', value: 'low' },
		{ label: 'Trung bình', value: 'medium' },
		{ label: 'Cao', value: 'high' },
		{ label: 'Khẩn cấp', value: 'urgent' },
	];

	const departmentOptions = computed(() => [
		{ label: 'Không chọn', value: null },
		...departments.value.map((d: any) => ({ label: d.name, value: String(d.id) })),
	]);

	const ticketTypeDesc = computed(() => {
		switch (form.type) {
			case '1':
				return "* Yêu cầu 'Vận hành' sẽ được duyệt ngay";
			case '2':
				return "* Yêu cầu 'Thay đổi' sẽ phải đợi duyệt";
			case '3':
				return "* Yêu cầu 'Phát triển' sẽ phải đợi duyệt";
			default:
				return '';
		}
	});

	const fetchDepartments = async () => {
		loadingDepts.value = true;
		try {
			const res = (await $api.department.getList()) as any;
			departments.value = res?.data?.departments || res?.data || [];
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
				status: 'draft',
				type: Number(form.type),
				departmentId: form.department_id ? Number(form.department_id) : null,
			};
			const res = (await $api.ticket.create(payload)) as any;
			const ticket = res?.data?.ticket || null;

			// Auto-submit after create
			if (ticket && ['draft', 'rejected'].includes(ticket.status) && ticket.id) {
				await $api.ticket.submit(ticket.ticket.id);
			}

			successToast({ title: 'Nộp yêu cầu thành công' });
			router.push(`/tickets/${ticket.ticket.id}`);
		} catch (err: any) {
			console.log(err);

			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể nộp yêu cầu' });
		} finally {
			submitting.value = false;
		}
	};

	onMounted(() => {
		fetchDepartments();
	});
</script>
