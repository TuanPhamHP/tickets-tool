<template>
	<UApp>
		<div class="flex h-screen overflow-hidden bg-gray-50">
			<!-- Mobile overlay -->
			<Transition name="fade">
				<div
					v-if="mobileOpen"
					class="fixed inset-0 z-20 bg-black/50 lg:hidden"
					@click="mobileOpen = false"
				/>
			</Transition>

			<!-- Sidebar -->
			<aside
				:class="[
					'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
					mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
					appStateStore.sideBarMini ? 'lg:w-[68px]' : 'lg:w-64',
					'w-64',
				]"
				style="background: linear-gradient(160deg, #1b5e20 0%, #2e7d32 45%, #388e3c 100%)"
			>
				<!-- Brand -->
				<div
					:class="[
						'flex items-center border-b border-white/20 transition-all duration-300',
						appStateStore.sideBarMini ? 'justify-center px-0 py-4' : 'gap-3 px-5 py-4',
					]"
				>
					<div class="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
						<UIcon name="i-heroicons-ticket" class="text-white text-xl" />
					</div>
					<div v-show="!appStateStore.sideBarMini" class="overflow-hidden">
						<p class="text-white font-bold text-base leading-tight whitespace-nowrap">XC Tickets</p>
						<p class="text-green-200 text-xs whitespace-nowrap">Quản lý yêu cầu</p>
					</div>
				</div>

				<!-- Navigation -->
				<nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
					<!-- Yêu cầu -->
					<NavItem
						to="/tickets"
						icon="i-heroicons-ticket"
						label="Yêu cầu"
						:mini="appStateStore.sideBarMini"
						:active="isActive('/tickets', true)"
					/>

					<!-- Admin section -->
					<template v-if="isAdmin">
						<div
							v-show="!appStateStore.sideBarMini"
							class="px-3 pt-4 pb-1"
						>
							<p class="text-green-200/80 text-xs font-semibold uppercase tracking-wider">Quản trị</p>
						</div>
						<div v-show="appStateStore.sideBarMini" class="pt-2 pb-1 flex justify-center">
							<div class="w-6 border-t border-white/20" />
						</div>

						<NavItem
							to="/admin/departments"
							icon="i-heroicons-building-office-2"
							label="Phòng ban"
							:mini="appStateStore.sideBarMini"
							:active="isActive('/admin/departments')"
						/>
						<NavItem
							to="/admin/users"
							icon="i-heroicons-users"
							label="Nhân sự"
							:mini="appStateStore.sideBarMini"
							:active="isActive('/admin/users')"
						/>
					</template>
				</nav>

				<!-- Bottom user section -->
				<div class="border-t border-white/20 p-2">
					<button
						:class="[
							'w-full flex items-center rounded-lg transition-colors duration-150 hover:bg-red-500/20 group',
							appStateStore.sideBarMini ? 'justify-center p-2' : 'gap-3 px-3 py-2.5',
						]"
						@click="handleLogout"
					>
						<div
							class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
						>
							{{ userInitial }}
						</div>
						<div v-show="!appStateStore.sideBarMini" class="flex-1 min-w-0 text-left overflow-hidden">
							<p class="text-white text-sm font-medium truncate">{{ user?.name }}</p>
							<p class="text-green-200 text-xs truncate">{{ roleLabel }}</p>
						</div>
						<UIcon
							v-show="!appStateStore.sideBarMini"
							name="i-heroicons-arrow-right-on-rectangle"
							class="text-white/50 group-hover:text-red-300 text-base flex-shrink-0 transition-colors"
						/>
					</button>
				</div>
			</aside>

			<!-- Main area -->
			<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
				<!-- Top header -->
				<header class="h-16 bg-white shadow-sm px-4 flex items-center gap-3 flex-shrink-0 z-10">
					<!-- Desktop toggle -->
					<UButton
						class="hidden lg:flex"
						variant="ghost"
						color="neutral"
						:icon="appStateStore.sideBarMini ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
						size="sm"
						@click="toggleSidebar"
					/>
					<!-- Mobile hamburger -->
					<UButton
						class="lg:hidden"
						variant="ghost"
						color="neutral"
						icon="i-heroicons-bars-3"
						size="sm"
						@click="mobileOpen = !mobileOpen"
					/>

					<!-- Page title -->
					<h1 class="flex-1 text-base font-semibold text-gray-800 truncate">{{ pageTitle }}</h1>

					<!-- User pill + logout -->
					<div class="flex items-center gap-2">
						<NotificationPanel />
						<div class="hidden sm:flex items-center gap-2 bg-gradient-to-r from-green-700 to-green-500 rounded-full px-3 py-1.5">
							<div
								class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
							>
								{{ userInitial }}
							</div>
							<div class="hidden md:block leading-tight">
								<p class="text-white text-xs font-medium whitespace-nowrap">{{ user?.name }}</p>
								<p class="text-green-200 text-[10px] whitespace-nowrap">{{ roleLabel }}</p>
							</div>
						</div>
						<UButton
							variant="ghost"
							color="error"
							icon="i-heroicons-arrow-right-on-rectangle"
							size="sm"
							@click="handleLogout"
						>
							<span class="hidden sm:inline text-sm">Đăng xuất</span>
						</UButton>
					</div>
				</header>

				<!-- Page content -->
				<main class="flex-1 overflow-y-auto p-4 lg:p-6">
					<slot />
				</main>
			</div>
		</div>
	</UApp>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
import { useAppStateStore } from '~/store/appState';
import { useNotificationStore } from '~/store/notification';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const appStateStore = useAppStateStore();
const notificationStore = useNotificationStore();
const { user, isLogged } = storeToRefs(authStore);
const router = useRouter();
const route = useRoute();

const mobileOpen = ref(false);

// Poll unread count every 30 seconds
let pollTimer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
	if (isLogged.value) {
		notificationStore.fetchUnreadCount();
		pollTimer = setInterval(() => {
			if (isLogged.value) notificationStore.fetchUnreadCount();
		}, 30000);
	}
});
onUnmounted(() => {
	if (pollTimer) clearInterval(pollTimer);
});

// Auth guard
onMounted(() => {
	if (!isLogged.value) router.push('/login');
});
watch(isLogged, (val) => {
	if (!val) router.push('/login');
});

// Close mobile sidebar on route change
watch(() => route.path, () => {
	mobileOpen.value = false;
});

const toggleSidebar = () => appStateStore.toggleSidebar();

// Computed
const isAdmin = computed(() => (user.value as any)?.role === 'admin');

const roleLabel = computed(() => {
	const roleMap: Record<string, string> = {
		admin: 'Quản trị viên',
		requester: 'Người yêu cầu',
		approver: 'Người phê duyệt',
		implementer: 'Người thực hiện',
	};
	return roleMap[(user.value as any)?.role] || (user.value as any)?.role || '';
});

const userInitial = computed(() => {
	const name = (user.value as any)?.name || '';
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return 'U';
	if (words.length === 1) return words[0][0].toUpperCase();
	return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
});

const pageTitleMap: Record<string, string> = {
	'/tickets': 'Danh sách yêu cầu',
	'/tickets/create': 'Tạo yêu cầu mới',
	'/admin/departments': 'Quản lý phòng ban',
	'/admin/users': 'Quản lý nhân sự',
};

const pageTitle = computed(() => {
	const path = route.path;
	if (pageTitleMap[path]) return pageTitleMap[path];
	if (path.startsWith('/tickets/') && path !== '/tickets/create') return 'Chi tiết yêu cầu';
	return 'XC Tickets';
});

const isActive = (path: string, prefix = false) => {
	const current = route.path;
	if (prefix) return current === path || current.startsWith(path + '/');
	return current === path || current.startsWith(path + '/');
};

const handleLogout = () => {
	authStore.logout();
	router.push('/login');
};
</script>

<!-- NavItem component defined inline -->
<script lang="ts">
import { defineComponent, h, ref } from 'vue';
import { resolveComponent } from 'vue';

const NavItem = defineComponent({
	name: 'NavItem',
	props: {
		to: String,
		icon: String,
		label: String,
		mini: Boolean,
		active: Boolean,
	},
	setup(props) {
		const showTooltip = ref(false);
		return () => {
			const NuxtLink = resolveComponent('NuxtLink');
			const UIcon = resolveComponent('UIcon');
			return h(
				'div',
				{ class: 'relative group' },
				[
					h(NuxtLink, {
						to: props.to,
						class: [
							'flex items-center rounded-lg transition-colors duration-150 relative overflow-hidden',
							props.mini ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
							props.active
								? 'bg-white/20 text-white font-medium'
								: 'text-white/65 hover:text-white hover:bg-white/10',
						].join(' '),
					}, () => [
						props.active && !props.mini
							? h('span', { class: 'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full' })
							: null,
						h(UIcon, { name: props.icon, class: 'text-lg flex-shrink-0' }),
						!props.mini
							? h('span', { class: 'text-sm whitespace-nowrap' }, props.label)
							: null,
					]),
					// Mini tooltip
					props.mini
						? h('div', {
							class: 'absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50',
						}, props.label)
						: null,
				]
			);
		};
	},
});

export default { components: { NavItem } };
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
