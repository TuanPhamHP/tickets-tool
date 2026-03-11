import { defineStore } from 'pinia';

export interface NotificationItem {
	id: number;
	type: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	ticketId: number | null;
	ticketCode: string | null;
	ticketTitle: string | null;
	actorName: string | null;
	actorAvatar: string | null;
}

export const useNotificationStore = defineStore('notification', {
	state: () => ({
		notifications: [] as NotificationItem[],
		unreadCount: 0,
		page: 1,
		hasMore: true,
		loading: false,
	}),
	actions: {
		async fetchUnreadCount() {
			try {
				const { $api } = useNuxtApp();
				const res = await $api.notification.getUnreadCount();
				this.unreadCount = (res as any)?.data?.count ?? 0;
			} catch (_) {}
		},
		async fetchNotifications(reset = false) {
			if (this.loading) return;
			if (!reset && !this.hasMore) return;
			this.loading = true;
			try {
				const { $api } = useNuxtApp();
				const page = reset ? 1 : this.page;
				const res = await $api.notification.getList({ page, limit: 15 }) as any;
				const items: NotificationItem[] = res?.data ?? [];
				const meta = res?.meta ?? {};
				if (reset) {
					this.notifications = items;
					this.page = 1;
				} else {
					this.notifications.push(...items);
				}
				this.unreadCount = meta.unreadCount ?? this.unreadCount;
				const total = meta.total ?? items.length;
				const loaded = this.notifications.length;
				this.hasMore = loaded < total;
				this.page = page + 1;
			} catch (_) {
			} finally {
				this.loading = false;
			}
		},
		async markRead(id: number) {
			try {
				const { $api } = useNuxtApp();
				await $api.notification.markRead(id);
				const item = this.notifications.find(n => n.id === id);
				if (item && !item.isRead) {
					item.isRead = true;
					this.unreadCount = Math.max(0, this.unreadCount - 1);
				}
			} catch (_) {}
		},
		async markAllRead() {
			try {
				const { $api } = useNuxtApp();
				await $api.notification.markAllRead();
				this.notifications.forEach(n => (n.isRead = true));
				this.unreadCount = 0;
			} catch (_) {}
		},
	},
});
