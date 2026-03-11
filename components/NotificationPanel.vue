<template>
	<div class="relative" ref="panelRef">
		<!-- Bell button -->
		<button
			class="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
			@click="togglePanel"
		>
			<UIcon name="i-heroicons-bell" class="text-xl" />
			<span
				v-if="store.unreadCount > 0"
				class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
			>
				{{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
			</span>
		</button>

		<!-- Dropdown panel -->
		<Transition name="dropdown">
			<div
				v-if="open"
				class="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col overflow-hidden"
				style="max-height: 480px"
			>
				<!-- Header -->
				<div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
					<span class="font-semibold text-gray-800 text-sm">Thông báo</span>
					<button
						v-if="store.unreadCount > 0"
						class="text-xs text-green-700 hover:text-green-900 font-medium transition-colors"
						@click="store.markAllRead()"
					>
						Đánh dấu tất cả đã đọc
					</button>
				</div>

				<!-- List -->
				<div class="overflow-y-auto flex-1" ref="listRef" @scroll="onScroll">
					<div v-if="store.notifications.length === 0 && !store.loading" class="py-12 text-center">
						<UIcon name="i-heroicons-bell-slash" class="text-3xl text-gray-300 mb-2" />
						<p class="text-sm text-gray-400">Không có thông báo</p>
					</div>

					<div
						v-for="item in store.notifications"
						:key="item.id"
						:class="[
							'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50',
							item.isRead ? 'hover:bg-gray-50' : 'bg-green-50 hover:bg-green-100',
						]"
						@click="handleClick(item)"
					>
						<!-- Avatar / icon -->
						<div class="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold overflow-hidden">
							<img v-if="item.actorAvatar" :src="item.actorAvatar" class="w-full h-full object-cover" />
							<span v-else>{{ getInitial(item.actorName) }}</span>
						</div>

						<div class="flex-1 min-w-0">
							<p class="text-sm text-gray-800 leading-snug">{{ item.message }}</p>
							<div class="flex items-center gap-2 mt-0.5">
								<span v-if="item.ticketCode" class="text-xs text-green-700 font-medium">#{{ item.ticketCode }}</span>
								<span class="text-xs text-gray-400">{{ formatTime(item.createdAt) }}</span>
							</div>
						</div>

						<!-- Unread dot -->
						<div v-if="!item.isRead" class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5" />
					</div>

					<!-- Loading more -->
					<div v-if="store.loading" class="flex justify-center py-4">
						<UIcon name="i-heroicons-arrow-path" class="text-xl text-gray-400 animate-spin" />
					</div>

					<!-- No more -->
					<div v-if="!store.hasMore && store.notifications.length > 0 && !store.loading" class="py-3 text-center text-xs text-gray-400">
						Đã hiển thị tất cả thông báo
					</div>
				</div>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '~/store/notification';
import type { NotificationItem } from '~/store/notification';

const store = useNotificationStore();
const router = useRouter();
const open = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

const togglePanel = async () => {
	open.value = !open.value;
	if (open.value) {
		await store.fetchNotifications(true);
	}
};

const onScroll = () => {
	const el = listRef.value;
	if (!el) return;
	const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
	if (nearBottom && store.hasMore && !store.loading) {
		store.fetchNotifications(false);
	}
};

const handleClick = async (item: NotificationItem) => {
	if (!item.isRead) {
		await store.markRead(item.id);
	}
	if (item.ticketId) {
		open.value = false;
		router.push(`/tickets/${item.ticketId}`);
	}
};

// Close on outside click
const handleOutsideClick = (e: MouseEvent) => {
	if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
		open.value = false;
	}
};

onMounted(() => {
	document.addEventListener('mousedown', handleOutsideClick);
	store.fetchUnreadCount();
});

onUnmounted(() => {
	document.removeEventListener('mousedown', handleOutsideClick);
});

const getInitial = (name: string | null): string => {
	if (!name) return '?';
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '?';
	if (words.length === 1) return words[0][0].toUpperCase();
	return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
};

const formatTime = (iso: string): string => {
	if (!iso) return '';
	const date = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return 'Vừa xong';
	if (diffMin < 60) return `${diffMin} phút trước`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} giờ trước`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay} ngày trước`;
	return date.toLocaleDateString('vi-VN');
};
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>
