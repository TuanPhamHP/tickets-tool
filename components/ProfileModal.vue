<template>
	<UModal v-model:open="modelOpen" :ui="{ content: 'max-w-lg' }">
		<template #content>
			<UCard>
				<template #header>
					<div class="flex items-center gap-3">
						<div
							class="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
							style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
						>
							{{ userInitials }}
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="text-base font-semibold text-gray-900 truncate">{{ user?.name }}</h3>
							<span
								class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5"
								:class="roleBadgeClass"
							>
								{{ roleLabel }}
							</span>
						</div>
						<UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="modelOpen = false" />
					</div>
				</template>

				<UTabs v-model="activeTab" :items="tabItems" class="w-full">
					<template #info>
						<div class="space-y-4 pt-3">
							<div class="grid grid-cols-2 gap-3">
								<div>
									<p class="text-xs text-gray-500 mb-1">Email</p>
									<p class="text-sm text-gray-700 font-medium truncate">{{ user?.email }}</p>
								</div>
								<div v-if="(user as any)?.company">
									<p class="text-xs text-gray-500 mb-1">Công ty</p>
									<p class="text-sm text-gray-700 font-medium truncate">{{ (user as any).company }}</p>
								</div>
							</div>

							<div class="border-t border-gray-100 pt-3 space-y-4">
								<UFormField label="Họ tên" required>
									<UInput
										v-model="form.name"
										placeholder="Nhập họ tên"
										class="w-full"
										:class="{ 'ring-2 ring-red-500': submitted && !form.name }"
									/>
									<p v-if="submitted && !form.name" class="text-xs text-red-500 mt-1">Họ tên không được để trống</p>
								</UFormField>

								<UFormField label="Số điện thoại">
									<UInput v-model="form.phone" placeholder="Nhập số điện thoại" class="w-full" />
								</UFormField>
							</div>
						</div>
					</template>

					<template #security>
						<div class="space-y-4 pt-3">
							<UFormField label="Mật khẩu hiện tại" required>
								<UInput
									v-model="pwForm.currentPassword"
									type="password"
									placeholder="Nhập mật khẩu hiện tại"
									class="w-full"
									:class="{ 'ring-2 ring-red-500': pwSubmitted && !pwForm.currentPassword }"
								/>
								<p v-if="pwSubmitted && !pwForm.currentPassword" class="text-xs text-red-500 mt-1">Bắt buộc</p>
							</UFormField>

							<UFormField label="Mật khẩu mới" required>
								<UInput
									v-model="pwForm.newPassword"
									type="password"
									placeholder="Tối thiểu 6 ký tự"
									class="w-full"
									:class="{ 'ring-2 ring-red-500': pwSubmitted && pwForm.newPassword.length < 6 }"
								/>
								<p v-if="pwSubmitted && pwForm.newPassword && pwForm.newPassword.length < 6" class="text-xs text-red-500 mt-1">Tối thiểu 6 ký tự</p>
							</UFormField>

							<UFormField label="Xác nhận mật khẩu mới" required>
								<UInput
									v-model="pwForm.confirmPassword"
									type="password"
									placeholder="Nhập lại mật khẩu mới"
									class="w-full"
									:class="{ 'ring-2 ring-red-500': pwSubmitted && pwMismatch }"
								/>
								<p v-if="pwSubmitted && pwMismatch" class="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
							</UFormField>
						</div>
					</template>
				</UTabs>

				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton variant="outline" color="neutral" @click="modelOpen = false">Đóng</UButton>
						<UButton
							v-if="activeTab === 0"
							:loading="saving"
							style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
							class="text-white"
							@click="saveProfile"
						>
							Lưu thay đổi
						</UButton>
						<UButton
							v-else
							:loading="savingPw"
							style="background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)"
							class="text-white"
							@click="changePassword"
						>
							Đổi mật khẩu
						</UButton>
					</div>
				</template>
			</UCard>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
import { storeToRefs } from 'pinia';
import { useCustomToast } from '~/composable/useCustomToast';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const modelOpen = computed({
	get: () => props.open,
	set: (val) => emit('update:open', val),
});

const { $api } = useNuxtApp() as ReturnType<typeof useNuxtApp> & { $api: Record<string, unknown> };
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { successToast, errorToast } = useCustomToast();

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const activeTab = ref(0);
const tabItems = [
	{ label: 'Thông tin cá nhân', slot: 'info' },
	{ label: 'Bảo mật', slot: 'security' },
];

// ─── Profile form ─────────────────────────────────────────────────────────────

const form = reactive({ name: '', phone: '' });
const submitted = ref(false);
const saving = ref(false);

watch(
	() => props.open,
	(val) => {
		if (val) {
			activeTab.value = 0;
			submitted.value = false;
			pwSubmitted.value = false;
			form.name = (user.value as unknown as Record<string, string>)?.name || '';
			form.phone = (user.value as unknown as Record<string, string>)?.phone || '';
			Object.assign(pwForm, { currentPassword: '', newPassword: '', confirmPassword: '' });
		}
	},
);

const saveProfile = async () => {
	submitted.value = true;
	if (!form.name) return;

	saving.value = true;
	try {
		const userId = (user.value as unknown as Record<string, number>)?.id;
		await ($api.admin as Record<string, unknown> as { updateUser: (id: number, data: Record<string, unknown>) => Promise<unknown> })
			.updateUser(userId, { name: form.name, phone: form.phone || null });
		await authStore.getUserInfo();
		successToast({ title: 'Cập nhật thông tin thành công' });
		modelOpen.value = false;
	} catch (err: unknown) {
		errorToast({ title: 'Lỗi', description: (err as Record<string, Record<string, string>>)?.data?.message || 'Không thể cập nhật thông tin' });
	} finally {
		saving.value = false;
	}
};

// ─── Password form ────────────────────────────────────────────────────────────

const pwForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const pwSubmitted = ref(false);
const savingPw = ref(false);
const pwMismatch = computed(() => pwForm.newPassword !== pwForm.confirmPassword);

const changePassword = async () => {
	pwSubmitted.value = true;
	if (!pwForm.currentPassword || pwForm.newPassword.length < 6 || pwMismatch.value) return;

	savingPw.value = true;
	try {
		await ($api.user as Record<string, unknown> as { changePassword: (data: Record<string, string>) => Promise<unknown> })
			.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
		successToast({ title: 'Đổi mật khẩu thành công' });
		Object.assign(pwForm, { currentPassword: '', newPassword: '', confirmPassword: '' });
		pwSubmitted.value = false;
	} catch (err: unknown) {
		errorToast({ title: 'Lỗi', description: (err as Record<string, Record<string, string>>)?.data?.message || 'Không thể đổi mật khẩu' });
	} finally {
		savingPw.value = false;
	}
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userInitials = computed(() => {
	const name = (user.value as unknown as Record<string, string>)?.name || '';
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return 'U';
	if (words.length === 1) return words[0][0].toUpperCase();
	return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
});

const roleLabel = computed(() => {
	const map: Record<string, string> = {
		admin: 'Quản trị viên',
		requester: 'Người yêu cầu',
		approver: 'Người phê duyệt',
		implementer: 'Người thực hiện',
	};
	return map[(user.value as unknown as Record<string, string>)?.role] || '';
});

const roleBadgeClass = computed(() => {
	const role = (user.value as unknown as Record<string, string>)?.role;
	return {
		'bg-purple-100 text-purple-700': role === 'admin',
		'bg-blue-100 text-blue-700': role === 'requester',
		'bg-amber-100 text-amber-700': role === 'approver',
		'bg-cyan-100 text-cyan-700': role === 'implementer',
	};
});
</script>
