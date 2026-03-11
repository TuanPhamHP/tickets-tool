<template>
	<UModal
		:open="open"
		:ui="{
			overlay: 'bg-black/40',
		}"
		:dismissible="false"
		:close="false"
		title="Đăng xuất"
	>
		<template #body>
			<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
				<div class="mt-2">
					<p class="text-sm text-gray-500">Bạn chắc chắn muốn đăng xuất tài khoản hiện tại?</p>
				</div>
			</div>
			<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
				<button
					type="button"
					class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
					@click="logout"
				>
					Đăng xuất
				</button>
				<button
					type="button"
					class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
					ref="cancelButtonRef"
					@click="triggerLogout(false)"
				>
					Hủy
				</button>
			</div>
		</template>
	</UModal>
</template>
<script lang="ts">
	import { ref } from 'vue';
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useAppStateStore } from '@/store/appState';

	export default {
		setup() {
			const authStore = useAuthStore();
			const appStateStore = useAppStateStore();
			const { triggerLogout } = appStateStore;
			const { onLogout } = storeToRefs(appStateStore);
			const open = ref(false);

			function logout() {
				authStore.logout();
				triggerLogout(false);
			}

			watch(onLogout, () => {
				open.value = onLogout.value;
			});
			watch(open, () => {
				triggerLogout(open.value);
			});
			return {
				open,
				triggerLogout,
				logout,
			};
		},
		data() {
			return {};
		},
		methods: {},
	};
</script>
