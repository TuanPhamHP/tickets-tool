<template>
	<div class="space-y-5">
		<!-- Back + header -->
		<div class="flex items-center gap-3">
			<UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="navigateTo('/tickets')" />
			<div class="flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<h2 class="text-xl font-bold text-gray-900">{{ ticket?.title || 'Chi tiết yêu cầu' }}</h2>
					<UBadge v-if="ticket?.status" :color="getStatusColor(ticket.status)" variant="soft">
						{{ getStatusLabel(ticket.status) }}
					</UBadge>
				</div>
				<p class="text-sm text-gray-500 font-mono mt-0.5">{{ ticket?.code || `#${route.params.id}` }}</p>
			</div>
		</div>

		<div v-if="loading" class="flex justify-center py-20">
			<UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-green-600" />
		</div>

		<template v-else-if="ticket">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<!-- Main info -->
				<div class="lg:col-span-2 space-y-5">
					<!-- Edit form -->
					<div v-if="editMode" class="bg-white rounded-xl border border-gray-200 p-5">
						<div class="flex items-center justify-between mb-4">
							<h3 class="font-semibold text-gray-800">Chỉnh sửa yêu cầu</h3>
							<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" size="sm" @click="editMode = false" />
						</div>
						<div class="space-y-4">
							<UFormField label="Tiêu đề" required>
								<UInput v-model="editForm.title" placeholder="Tiêu đề yêu cầu..." class="w-full" />
							</UFormField>
							<UFormField label="Loại yêu cầu" required>
								<USelect v-model="editForm.type" :items="typeOptions" class="w-full" />
							</UFormField>
							<UFormField label="Mô tả">
								<MarkdownEditor
									v-model="editForm.description"
									placeholder="Mô tả chi tiết..."
									:rows="6"
									class="w-full"
								/>
							</UFormField>
							<div class="grid grid-cols-2 gap-4">
								<UFormField label="Ưu tiên">
									<USelect v-model="editForm.priority" :items="priorityOptions" class="w-full" />
								</UFormField>
								<UFormField label="Deadline">
									<UInput v-model="editForm.deadline" type="date" class="w-full" />
								</UFormField>
							</div>
							<UFormField label="Phòng ban">
								<USelect
									v-model="editForm.department_id"
									:items="departmentOptions"
									:loading="loadingDepts"
									placeholder="Không chọn"
									class="w-full"
								/>
							</UFormField>
							<div class="flex gap-3 pt-2">
								<UButton variant="outline" color="neutral" @click="editMode = false">Huỷ</UButton>
								<UButton
									:loading="saving"
									icon="i-heroicons-check"
									style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
									class="text-white"
									@click="saveEdit"
									>Lưu thay đổi</UButton
								>
							</div>
						</div>
					</div>

					<!-- Ticket info card -->
					<div v-else class="bg-white rounded-xl border border-gray-200 p-5">
						<h3 class="font-semibold text-gray-800 mb-4">Thông tin yêu cầu</h3>
						<dl class="grid grid-cols-2 gap-4">
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Loại</dt>
								<dd class="mt-1">
									<UBadge :color="getTypeColor(ticket.type)" variant="soft" size="sm">
										{{ getTypeLabel(ticket.type) }}
									</UBadge>
								</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ưu tiên</dt>
								<dd class="mt-1">
									<UBadge :color="getPriorityColor(ticket.priority)" variant="soft" size="sm">
										{{ getPriorityLabel(ticket.priority) }}
									</UBadge>
								</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Phòng ban</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ ticket.department?.name || '-' }}</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Deadline</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ formatDate(ticket.deadline) }}</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Người yêu cầu</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ ticket.requester?.name || '-' }}</dd>
							</div>
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ngày tạo</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ formatDate(ticket.createdAt) }}</dd>
							</div>
							<div v-if="ticket.estimateHours">
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Thời gian dự kiến:</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ ticket.estimateHours }} giờ</dd>
							</div>
							<div v-if="ticket.assignee">
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Người thực hiện</dt>
								<dd class="mt-1 text-sm text-gray-700">{{ ticket.assignee?.name || '-' }}</dd>
							</div>
						</dl>

						<div v-if="ticket.description" class="mt-4 pt-4 border-t border-gray-100">
							<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mô tả</dt>
							<dd class="prose prose-sm max-w-none text-gray-700" v-html="formatDescription(ticket.description)"></dd>
						</div>
					</div>

					<!-- Action buttons -->
					<div v-if="availableActions.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
						<h3 class="font-semibold text-gray-800 mb-4">Thao tác</h3>
						<div class="flex flex-wrap gap-3">
							<!-- Submit -->
							<UButton
								v-if="availableActions.includes('submit')"
								icon="i-heroicons-paper-airplane"
								:loading="actionLoading === 'submit'"
								style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
								class="text-white"
								@click="handleAction('submit')"
							>
								Nộp yêu cầu
							</UButton>

							<!-- Edit -->
							<UButton
								v-if="availableActions.includes('edit')"
								variant="outline"
								color="neutral"
								icon="i-heroicons-pencil"
								@click="openEditMode()"
							>
								Chỉnh sửa
							</UButton>

							<!-- Approve -->
							<UButton
								v-if="availableActions.includes('approve')"
								icon="i-heroicons-check-circle"
								:loading="actionLoading === 'approve'"
								color="success"
								@click="openActionModal('approve')"
							>
								Phê duyệt
							</UButton>

							<!-- Reject -->
							<UButton
								v-if="availableActions.includes('reject')"
								icon="i-heroicons-x-circle"
								:loading="actionLoading === 'reject'"
								color="error"
								variant="outline"
								@click="openActionModal('reject')"
							>
								Từ chối
							</UButton>

							<!-- Estimate -->
							<UButton
								v-if="availableActions.includes('estimate')"
								icon="i-heroicons-clock"
								:loading="actionLoading === 'estimate'"
								color="info"
								variant="outline"
								@click="openActionModal('estimate')"
							>
								Báo Estimate
							</UButton>

							<!-- Start -->
							<UButton
								v-if="availableActions.includes('start')"
								icon="i-heroicons-play"
								:loading="actionLoading === 'start'"
								color="info"
								@click="handleAction('start')"
							>
								Bắt đầu thực hiện
							</UButton>

							<!-- Complete -->
							<UButton
								v-if="availableActions.includes('complete')"
								icon="i-heroicons-check"
								:loading="actionLoading === 'complete'"
								color="success"
								@click="openActionModal('complete')"
							>
								Hoàn tất
							</UButton>

							<!-- Accept -->
							<UButton
								v-if="availableActions.includes('accept')"
								icon="i-heroicons-hand-thumb-up"
								:loading="actionLoading === 'accept'"
								style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
								class="text-white"
								@click="openActionModal('accept')"
							>
								Nghiệm thu
							</UButton>

							<!-- Cancel -->
							<UButton
								v-if="availableActions.includes('cancel')"
								icon="i-heroicons-x-mark"
								:loading="actionLoading === 'cancel'"
								color="error"
								variant="ghost"
								@click="openActionModal('cancel')"
							>
								Huỷ
							</UButton>
						</div>
					</div>

					<!-- Status workflow -->
					<div class="bg-white rounded-xl border border-gray-200 p-5">
						<h3 class="font-semibold text-gray-800 mb-4">Tiến trình</h3>
						<div class="flex items-center gap-0">
							<div v-for="(step, idx) in workflowSteps" :key="step.key" class="flex items-center flex-1">
								<div class="flex flex-col items-center flex-shrink-0">
									<div
										:class="[
											'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
											isStepDone(step.key) ? 'text-white' : 'bg-gray-100 text-gray-400',
										]"
										:style="
											isStepDone(step.key) ? 'background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)' : ''
										"
									>
										<UIcon v-if="isStepDone(step.key)" name="i-heroicons-check" class="text-sm" />
										<span v-else>{{ idx + 1 }}</span>
									</div>
									<p
										class="text-xs text-center mt-1 max-w-[60px] leading-tight"
										:class="isStepDone(step.key) ? 'text-green-700 font-medium' : 'text-gray-400'"
									>
										{{ step.label }}
									</p>
								</div>
								<div
									v-if="idx < workflowSteps.length - 1"
									:class="[
										'flex-1 h-0.5 mx-1 mb-5',
										isStepDone(workflowSteps[idx + 1]?.key) ? 'bg-green-500' : 'bg-gray-200',
									]"
								/>
							</div>
						</div>
					</div>

					<!-- Comments -->
					<div class="bg-white rounded-xl border border-gray-200 p-5">
						<h3 class="font-semibold text-gray-800 mb-4">Bình luận</h3>

						<!-- Comment list -->
						<div class="space-y-3 mb-4">
							<div v-for="comment in comments" :key="comment.id" class="flex gap-3">
								<UAvatar :alt="comment.user?.name || 'U'" size="sm" class="flex-shrink-0" />
								<div class="flex-1 bg-gray-50 rounded-lg p-3">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-medium text-gray-800">{{ comment.user?.name }}</span>
										<span class="text-xs text-gray-400">{{ formatDateTime(comment.createdAt) }}</span>
									</div>
									<p class="text-sm text-gray-700 comment-content" v-html="renderComment(comment.content)" />
								</div>
							</div>
							<div v-if="comments.length === 0" class="text-sm text-gray-400 text-center py-4">
								Chưa có bình luận nào
							</div>
						</div>

						<!-- Add comment -->
						<div class="flex gap-2">
							<MentionTextarea v-model="newComment" :users="mentionUsers" placeholder="Viết bình luận... (gõ @ để tag người dùng)" :rows="2" class="flex-1" />
							<UButton
								:loading="addingComment"
								:disabled="!newComment.trim()"
								style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
								class="text-white self-end"
								icon="i-heroicons-paper-airplane"
								@click="addComment"
							/>
						</div>
					</div>
				</div>

				<!-- Sidebar: history -->
				<div class="space-y-4">
					<div class="bg-white rounded-xl border border-gray-200 p-5">
						<h3 class="font-semibold text-gray-800 mb-4">Lịch sử</h3>
						<div class="space-y-3">
							<div v-for="(log, idx) in history" :key="idx" class="flex gap-3">
								<div class="flex flex-col items-center">
									<div class="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
									<div v-if="idx < history.length - 1" class="w-0.5 flex-1 bg-gray-200 my-1" />
								</div>
								<div class="flex-1 pb-2">
									<p class="text-sm text-gray-700">
										{{ getHistoryLabel(log.history.action_label || log.history.action) }}
									</p>
									<p v-if="log.history.note || log.history.reason" class="text-xs text-gray-500 mt-0.5 italic">
										<b>Note</b>: {{ log.history.note || log.history.reason }}
									</p>
									<p class="text-xs text-gray-400 mt-0.5">
										bởi {{ log.user?.name }}, vào lúc {{ formatDateTime(log.history.createdAt) }}
									</p>
								</div>
							</div>
							<div v-if="history.length === 0" class="text-sm text-gray-400 text-center py-2">Chưa có lịch sử</div>
						</div>
					</div>
				</div>
			</div>
		</template>

		<!-- Action modal -->
		<UModal v-model:open="actionModalOpen">
			<template #content>
				<UCard>
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-base font-semibold">{{ actionModalTitle }}</h3>
							<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="actionModalOpen = false" />
						</div>
					</template>

					<div class="space-y-4">
						<!-- Estimate: hours input -->
						<UFormField v-if="currentAction === 'estimate'" label="Số giờ estimate" required>
							<UInput v-model="actionHours" type="number" placeholder="Nhập số giờ" class="w-full" />
						</UFormField>

						<!-- Reject/Cancel: reason required -->
						<UFormField
							v-if="['reject', 'cancel'].includes(currentAction)"
							:label="currentAction === 'reject' ? 'Lý do từ chối' : 'Lý do huỷ'"
							required
						>
							<UTextarea v-model="actionReason" placeholder="Nhập lý do..." :rows="3" class="w-full" />
						</UFormField>

						<!-- Others: optional note -->
						<UFormField v-if="!['reject', 'cancel'].includes(currentAction)" label="Ghi chú (tuỳ chọn)">
							<UTextarea v-model="actionNote" placeholder="Ghi chú thêm..." :rows="3" class="w-full" />
						</UFormField>
					</div>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton variant="outline" color="neutral" @click="actionModalOpen = false">Huỷ</UButton>
							<UButton
								:loading="actionLoading === currentAction"
								:color="['reject', 'cancel'].includes(currentAction) ? 'error' : 'success'"
								@click="confirmAction"
							>
								Xác nhận
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
	import { formatDateTime, getHistoryLabel, formatDescription } from '@/utils/formater';

	definePageMeta({ layout: 'default' });

	const { $api } = useNuxtApp();
	const route = useRoute();
	const authStore = useAuthStore();
	const { user } = storeToRefs(authStore);
	const { successToast, errorToast } = useCustomToast();

	const id = Number(route.params.id);

	const ticket = ref<any>(null);
	const loading = ref(false);
	const comments = ref<any[]>([]);
	const history = ref<any[]>([]);
	const newComment = ref('');
	const addingComment = ref(false);
	const mentionUsers = ref([]);
	const editMode = ref(false);
	const saving = ref(false);
	const loadingDepts = ref(false);
	const departments = ref([]);

	const editForm = reactive({
		title: '',
		type: '',
		description: '',
		priority: 'medium',
		department_id: null,
		deadline: '',
	});

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
		...departments.value.map(d => ({ label: d.name, value: String(d.id) })),
	]);
	const actionLoading = ref('');
	const actionModalOpen = ref(false);
	const currentAction = ref('');
	const actionNote = ref('');
	const actionReason = ref('');
	const actionHours = ref('');

	const workflowSteps = [
		{ key: 'draft', label: 'Nháp' },
		{ key: 'pending_approval', label: 'Chờ duyệt' },
		{ key: 'approved', label: 'Đã duyệt' },
		{ key: 'in_progress', label: 'Đang thực hiện' },
		{ key: 'completed', label: 'Hoàn tất' },
		{ key: 'accepted', label: 'Nghiệm thu' },
	];

	const statusOrder = ['draft', 'pending_approval', 'approved', 'in_progress', 'completed', 'accepted'];

	const isStepDone = (key: string) => {
		if (!ticket.value) return false;
		if (ticket.value.status === 'rejected' || ticket.value.status === 'cancelled') {
			return key === 'draft';
		}
		const currentIdx = statusOrder.indexOf(ticket.value.status);
		const stepIdx = statusOrder.indexOf(key);
		return stepIdx <= currentIdx;
	};

	// Role-based available actions
	const availableActions = computed(() => {
		if (!ticket.value) return [];
		const role = (user.value as any)?.role;
		const status = ticket.value.status;
		const userId = (user.value as any)?.id;
		const isRequester = role === 'requester' || ticket.value.requester_id === userId || role === 'admin';
		const isApprover = role === 'approver' || role === 'admin';
		const isImplementer = role === 'implementer' || role === 'admin';

		const actions: string[] = [];

		if (isRequester && status === 'draft') {
			actions.push('submit', 'edit', 'cancel');
		}
		if (isApprover && status === 'pending_approval') {
			actions.push('approve', 'reject', 'edit');
		}
		if (isImplementer && status === 'approved') {
			actions.push('estimate', 'start');
		}
		if (isImplementer && status === 'in_progress') {
			actions.push('complete');
		}
		if (isRequester && status === 'completed') {
			actions.push('accept');
		}

		return actions;
	});

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
			cancelled: 'error',
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
			cancelled: 'Đã huỷ',
		};
		return map[status] || status;
	};

	const getTypeColor = (typeId: number | string) => {
		const map: Record<string, string> = { '1': 'success', '2': 'warning', '3': 'secondary' };
		return map[String(typeId)] || 'neutral';
	};

	const getTypeLabel = (typeId: number | string) => {
		const map: Record<string, string> = { '1': 'Vận hành', '2': 'Thay đổi', '3': 'Phát triển' };
		return map[String(typeId)] || `Loại ${typeId}`;
	};

	const getPriorityColor = (priority: string) => {
		const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'error' };
		return map[priority] || 'neutral';
	};

	const getPriorityLabel = (priority: string) => {
		const map: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', urgent: 'Khẩn cấp' };
		return map[priority] || priority;
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
	};

	// Action modal
	const actionModalTitles: Record<string, string> = {
		approve: 'Phê duyệt yêu cầu',
		reject: 'Từ chối yêu cầu',
		estimate: 'Báo estimate',
		complete: 'Hoàn tất yêu cầu',
		accept: 'Nghiệm thu yêu cầu',
		cancel: 'Huỷ yêu cầu',
	};

	const actionModalTitle = computed(() => actionModalTitles[currentAction.value] || 'Thao tác');

	const openActionModal = (action: string) => {
		currentAction.value = action;
		actionNote.value = '';
		actionReason.value = '';
		actionHours.value = '';
		actionModalOpen.value = true;
	};

	const handleAction = async (action: string) => {
		actionLoading.value = action;
		try {
			switch (action) {
				case 'submit':
					await $api.ticket.submit(id);
					break;
				case 'start':
					await $api.ticket.start(id);
					break;
			}
			successToast({ title: 'Thao tác thành công' });
			await fetchTicket();
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Thao tác thất bại' });
		} finally {
			actionLoading.value = '';
		}
	};

	const confirmAction = async () => {
		const action = currentAction.value;

		// Validate
		if (['reject', 'cancel'].includes(action) && !actionReason.value.trim()) {
			errorToast({ title: 'Vui lòng nhập lý do' });
			return;
		}
		if (action === 'estimate' && !actionHours.value) {
			errorToast({ title: 'Vui lòng nhập số giờ estimate' });
			return;
		}

		actionLoading.value = action;
		actionModalOpen.value = false;
		try {
			switch (action) {
				case 'approve':
					await $api.ticket.approve(id, actionNote.value);
					break;
				case 'reject':
					await $api.ticket.reject(id, actionReason.value);
					break;
				case 'estimate':
					await $api.ticket.estimate(id, Number(actionHours.value), actionNote.value);
					break;
				case 'complete':
					await $api.ticket.complete(id, actionNote.value);
					break;
				case 'accept':
					await $api.ticket.accept(id, actionNote.value);
					break;
				case 'cancel':
					await $api.ticket.cancel(id, actionReason.value);
					break;
			}
			successToast({ title: 'Thao tác thành công' });
			await fetchTicket();
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Thao tác thất bại' });
		} finally {
			actionLoading.value = '';
		}
	};

	const fetchDepartments = async () => {
		loadingDepts.value = true;
		try {
			const res = await $api.department.getList();
			departments.value = res?.data?.departments || res?.data || [];
		} catch {
			// silently fail
		} finally {
			loadingDepts.value = false;
		}
	};

	const openEditMode = () => {
		if (!ticket.value) return;
		editForm.title = ticket.value.title ?? '';
		editForm.type = String(ticket.value.type ?? '');
		editForm.description = ticket.value.description ?? '';
		editForm.priority = ticket.value.priority ?? 'medium';
		editForm.department_id = ticket.value.departmentId ? String(ticket.value.departmentId) : null;
		editForm.deadline = ticket.value.deadline ? new Date(ticket.value.deadline).toISOString().slice(0, 10) : '';
		editMode.value = true;
	};

	const saveEdit = async () => {
		if (!editForm.title || !editForm.type) {
			errorToast({ title: 'Vui lòng điền tiêu đề và loại yêu cầu' });
			return;
		}
		saving.value = true;
		try {
			await $api.ticket.update(id, {
				title: editForm.title,
				description: editForm.description,
				type: Number(editForm.type),
				priority: editForm.priority,
				departmentId: editForm.department_id ? Number(editForm.department_id) : null,
				deadline: editForm.deadline || null,
			});
			successToast({ title: 'Cập nhật yêu cầu thành công' });
			editMode.value = false;
			await fetchTicket();
		} catch (err) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể cập nhật yêu cầu' });
		} finally {
			saving.value = false;
		}
	};

	// Data fetching
	const fetchTicket = async () => {
		loading.value = true;
		try {
			const res = (await $api.ticket.getOne(id)) as any;
			ticket.value = res?.data?.ticket || res?.data || null;
			history.value = ticket.value?.history || ticket.value?.logs || [];
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể tải yêu cầu' });
		} finally {
			loading.value = false;
		}
	};

	const renderComment = (text: string): string => {
		if (!text) return '';
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\n/g, '<br>')
			.replace(/@\[([^\]]+)\]/g, '<span class="mention-tag">@$1</span>');
	};
	const fetchMentionUsers = async () => {
		try {
			const res = await $api.user.getMentionList();
			mentionUsers.value = res?.data || [];
		} catch {
			// silently fail
		}
	};

	const fetchComments = async () => {
		try {
			const res = (await $api.ticket.getComments(id)) as any;
			comments.value = res?.data?.comments || res?.data || [];
		} catch {
			// silently fail
		}
	};

	const addComment = async () => {
		if (!newComment.value.trim()) return;
		addingComment.value = true;
		try {
			await $api.ticket.addComment(id, newComment.value.trim());
			newComment.value = '';
			await fetchComments();
			// successToast({ title: 'Đã thêm bình luận' });
		} catch (err: any) {
			errorToast({ title: 'Lỗi', description: err?.data?.message || 'Không thể thêm bình luận' });
		} finally {
			addingComment.value = false;
		}
	};

	onMounted(async () => {
		await Promise.all([fetchTicket(), fetchComments(), fetchDepartments(), fetchMentionUsers()]);
	});
</script>
