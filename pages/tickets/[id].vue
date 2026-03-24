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
							<div v-if="ticket.estimateDays">
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Thời gian dự kiến</dt>
								<dd class="mt-1 text-sm text-gray-700 bg-green-50 text-green-700 w-fit rounded p-1">
									{{ ticket.estimateDays }} ngày
								</dd>
							</div>
							<div v-if="ticket.estimateCost !== null && ticket.estimateCost !== undefined && canSeeCost">
								<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi phí dự kiến</dt>
								<dd class="mt-1 text-sm font-medium text-orange-700">{{ formatCost(ticket.estimateCost) }}</dd>
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

							<!-- Review (tech) -->
							<UButton
								v-if="availableActions.includes('review')"
								icon="i-heroicons-clipboard-document-check"
								:loading="actionLoading === 'review'"
								color="info"
								@click="openActionModal('review')"
							>
								Xem xét & Estimate
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
						<div ref="commentListRef" class="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1" @scroll="onCommentScroll">
							<!-- Load more indicator -->
							<div v-if="loadingMoreComments" class="flex justify-center py-2">
								<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-gray-400 animate-spin" />
							</div>
							<div v-else-if="commentHasMore" class="text-xs text-gray-400 text-center py-1">Cuộn lên để xem thêm</div>

							<div v-if="comments.length === 0" class="text-sm text-gray-400 text-center py-4">
								Chưa có bình luận nào
							</div>

							<div
								v-for="comment in comments"
								:key="comment.id"
								class="flex gap-2"
								:class="comment.user?.id === (user as any)?.id ? 'flex-row-reverse' : 'flex-row'"
							>
								<UAvatar :alt="comment.user?.name || 'U'" size="sm" class="flex-shrink-0 mt-1" />
								<div
									class="max-w-[75%] rounded-2xl px-3 py-2"
									:class="
										comment.user?.id === (user as any)?.id
											? 'bg-green-100 text-gray-700 rounded-tr-sm'
											: 'bg-gray-100 text-gray-800 rounded-tl-sm'
									"
								>
									<div
										class="flex items-center gap-2 mb-0.5"
										:class="comment.user?.id === (user as any)?.id ? 'flex-row-reverse' : ''"
									>
										<span
											class="text-xs font-semibold"
											:class="comment.user?.id === (user as any)?.id ? 'hidden text-gray-600' : 'text-gray-600'"
											>{{ comment.user?.name }}</span
										>
									</div>
									<p
										class="text-sm comment-content leading-relaxed"
										:class="comment.user?.id === (user as any)?.id ? 'text-gray-700' : 'text-gray-700'"
										v-html="renderComment(comment.content)"
									/>
									<span class="text-xs opacity-60">{{ formatTimeWithGap(comment.createdAt) }}</span>
								</div>
							</div>
						</div>

						<!-- Add comment -->
						<div class="flex gap-2">
							<MentionTextarea
								v-model="newComment"
								:users="mentionUsers"
								placeholder="Viết bình luận... (gõ @ để tag, Enter để gửi, Shift+Enter xuống dòng)"
								:rows="2"
								class="flex-1"
								@submit="addComment"
							/>
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
						<!-- Review: estimate days + cost -->
						<template v-if="currentAction === 'review'">
							<UFormField label="Số ngày thực hiện dự kiến" required>
								<UInput
									v-model="reviewDays"
									type="number"
									min="0.5"
									step="0.5"
									placeholder="Ví dụ: 3.5"
									class="w-full"
								/>
							</UFormField>
							<UFormField label="Chi phí dự kiến (VNĐ)" required>
								<UInput
									v-model="reviewCostDisplay"
									type="text"
									inputmode="numeric"
									placeholder="Ví dụ: 5.000.000"
									class="w-full"
								/>
							</UFormField>
							<UFormField label="Ghi chú kỹ thuật (tuỳ chọn)">
								<UTextarea
									v-model="actionNote"
									placeholder="Mô tả phạm vi, rủi ro, giải pháp..."
									:rows="3"
									class="w-full"
								/>
							</UFormField>
						</template>

						<!-- Reject/Cancel: reason required -->
						<UFormField
							v-if="['reject', 'cancel'].includes(currentAction)"
							:label="currentAction === 'reject' ? 'Lý do từ chối' : 'Lý do huỷ'"
							required
						>
							<UTextarea v-model="actionReason" placeholder="Nhập lý do..." :rows="3" class="w-full" />
						</UFormField>

						<!-- Others: optional note -->
						<UFormField v-if="!['review', 'reject', 'cancel'].includes(currentAction)" label="Ghi chú (tuỳ chọn)">
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
	import {
		formatDateTime,
		formatTimeWithGap,
		getHistoryLabel,
		formatDescription,
		renderComment,
	} from '@/utils/formater';

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
	const commentPage = ref(1);
	const commentTotal = ref(0);
	const commentHasMore = computed(() => comments.value.length < commentTotal.value);
	const loadingMoreComments = ref(false);
	const commentListRef = ref<HTMLElement | null>(null);
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
		{ label: 'Xử lý vận hành', value: '1' },
		{ label: 'Thay đổi và tối ưu', value: '2' },
		{ label: 'Trích xuất dữ liệu (xây module)', value: '3' },
		{ label: 'Phát triển tính năng mới', value: '4' },
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
	const reviewDays = ref('');
	const reviewCost = ref('');
	const reviewCostDisplay = computed({
		get(): string {
			if (!reviewCost.value) return '';
			return reviewCost.value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		},
		set(val: string) {
			reviewCost.value = (val ?? '').replace(/\D/g, '');
		},
	});

	const workflowSteps = computed(() => {
		const steps = [
			{ key: 'draft', label: 'Nháp' },
			{ key: 'pending_review', label: 'Tech xem xét' },
			...(ticket.value?.type !== 1 ? [{ key: 'pending_approval', label: 'Chờ phê duyệt' }] : []),
			{ key: 'approved', label: 'Đã duyệt' },
			{ key: 'in_progress', label: 'Đang thực hiện' },
			{ key: 'completed', label: 'Hoàn tất' },
			{ key: 'accepted', label: 'Nghiệm thu' },
		];
		return steps;
	});

	const statusOrder = computed(() => {
		if (ticket.value?.type === 1) {
			return ['draft', 'pending_review', 'approved', 'in_progress', 'completed', 'accepted'];
		}
		return ['draft', 'pending_review', 'pending_approval', 'approved', 'in_progress', 'completed', 'accepted'];
	});

	const isStepDone = (key: string) => {
		if (!ticket.value) return false;
		if (ticket.value.status === 'rejected' || ticket.value.status === 'cancelled') {
			return key === 'draft';
		}
		const currentIdx = statusOrder.value.indexOf(ticket.value.status);
		const stepIdx = statusOrder.value.indexOf(key);
		return stepIdx <= currentIdx;
	};

	// Only approver/admin can see cost estimate
	const canSeeCost = computed(() => {
		const role = (user.value as any)?.role;
		return role === 'approver' || role === 'admin' || role === 'implementer';
	});

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

		// Requester: submit / edit / cancel từ draft; cancel từ pending_review và pending_approval
		if (isRequester && status === 'draft') {
			actions.push('submit', 'edit', 'cancel');
		}
		if (isRequester && ['pending_review', 'pending_approval', 'approved', 'rejected'].includes(status)) {
			actions.push('cancel');
		}
		if (isRequester && status === 'rejected') {
			actions.push('submit', 'edit');
		}

		// Implementer: xem xét & estimate khi pending_review; bắt đầu & hoàn tất khi approved/in_progress
		if (isImplementer && status === 'pending_review') {
			actions.push('review');
		}
		if (isImplementer && status === 'approved') {
			actions.push('start');
		}
		if (isImplementer && status === 'in_progress') {
			actions.push('complete');
		}

		// Approver: phê duyệt / từ chối khi pending_approval
		if (isApprover && status === 'pending_approval') {
			actions.push('approve', 'reject');
		}

		// Requester/admin: nghiệm thu
		if (isRequester && status === 'completed') {
			actions.push('accept');
		}

		return [...new Set(actions)];
	});

	// Helpers
	const getStatusColor = (status: string) => {
		const map: Record<string, string> = {
			draft: 'neutral',
			pending_review: 'info',
			pending_approval: 'warning',
			approved: 'success',
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
			pending_review: 'Chờ tech xem xét',
			pending_approval: 'Chờ phê duyệt',
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
		const map: Record<string, string> = { '1': 'success', '2': 'warning', '3': 'info', '4': 'secondary' };
		return map[String(typeId)] || 'neutral';
	};

	const getTypeLabel = (typeId: number | string) => {
		const map: Record<string, string> = {
			'1': 'Xử lý vận hành',
			'2': 'Thay đổi và tối ưu',
			'3': 'Trích xuất dữ liệu',
			'4': 'Phát triển tính năng',
		};
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

	const formatCost = (cost: number) => {
		if (cost === 0) return 'Miễn phí';
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cost);
	};

	// Action modal
	const actionModalTitles: Record<string, string> = {
		review: 'Xem xét & Estimate',
		approve: 'Phê duyệt yêu cầu',
		reject: 'Từ chối yêu cầu',
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
		reviewDays.value = '';
		reviewCost.value = '';
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
		if (action === 'review') {
			if (!reviewDays.value || Number(reviewDays.value) <= 0) {
				errorToast({ title: 'Vui lòng nhập số ngày dự kiến' });
				return;
			}
			if (reviewCost.value === '' || reviewCost.value === null) {
				errorToast({ title: 'Vui lòng nhập chi phí dự kiến' });
				return;
			}
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
				case 'review':
					await $api.ticket.review(
						id,
						Number(reviewDays.value),
						Number(reviewCost.value),
						actionNote.value || undefined,
					);
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
			const res = (await $api.ticket.getComments(id, 1, 10)) as any;
			const items: any[] = res?.data || [];
			commentTotal.value = res?.meta?.total ?? items.length;
			commentPage.value = 1;
			// Server trả về desc (mới nhất trước) — reverse để hiển thị cũ → mới (mới nhất ở dưới)
			comments.value = [...items].reverse();
		} catch {
			// silently fail
		}
	};

	const loadMoreComments = async () => {
		if (loadingMoreComments.value || !commentHasMore.value) return;
		loadingMoreComments.value = true;
		const container = commentListRef.value;
		const prevScrollHeight = container?.scrollHeight ?? 0;
		try {
			const nextPage = commentPage.value + 1;
			const res = (await $api.ticket.getComments(id, nextPage, 10)) as any;
			const items: any[] = res?.data || [];
			commentTotal.value = res?.meta?.total ?? commentTotal.value;
			commentPage.value = nextPage;
			// Prepend older items (also reversed to asc)
			comments.value = [...items].reverse().concat(comments.value);
			// Restore scroll position so content doesn't jump
			await nextTick();
			if (container) {
				container.scrollTop = container.scrollHeight - prevScrollHeight;
			}
		} catch {
			// silently fail
		} finally {
			loadingMoreComments.value = false;
		}
	};

	const onCommentScroll = (e: Event) => {
		const el = e.target as HTMLElement;
		if (el.scrollTop === 0 && commentHasMore.value && !loadingMoreComments.value) {
			loadMoreComments();
		}
	};

	const scrollCommentsToBottom = () => {
		nextTick(() => {
			const el = commentListRef.value;
			if (el) el.scrollTop = el.scrollHeight;
		});
	};

	const addComment = async () => {
		if (!newComment.value.trim()) return;
		addingComment.value = true;
		const content = newComment.value.trim();
		try {
			await $api.ticket.addComment(id, content);
			newComment.value = '';
			// Optimistically append then refresh total count
			const res = (await $api.ticket.getComments(id, 1, 1)) as any;
			commentTotal.value = res?.meta?.total ?? commentTotal.value + 1;
			const newItem = res?.data?.[0];
			if (newItem) comments.value.push(newItem);
			scrollCommentsToBottom();
		} catch (err: unknown) {
			errorToast({ title: 'Lỗi', description: (err as any)?.data?.message || 'Không thể thêm bình luận' });
		} finally {
			addingComment.value = false;
		}
	};

	onMounted(async () => {
		await Promise.all([fetchTicket(), fetchComments(), fetchDepartments(), fetchMentionUsers()]);
		scrollCommentsToBottom();
	});
</script>
