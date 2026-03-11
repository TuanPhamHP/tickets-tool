import { defineStore } from 'pinia';
const currentStates = [0, 1, 2, 3, 4] as const;
type validAppStateNumb = (typeof currentStates)[number];
export const useAppStateStore = defineStore('appState', {
	state: () => ({
		globalLoading: true as boolean,
		globalFetching: false as boolean,
		globalSync: 0 as number,
		sideBarMini: true,
		currentViewTitle: '',
		onLogout: false,
		currentState: 1, // 1: Check Auth | 2: Fetching Data | 3: Ready | 0: Errors
		fetchingPermisson: 0, // 0: fetching | 1: success | 2: fail | 3: unable to call api
		triggerSyncNoti: 0,
	}),

	actions: {
		setFetchingPermisson(payload: number) {
			this.fetchingPermisson = payload;
		},
		setTriggerSyncNoti() {
			this.triggerSyncNoti += 1;
		},
		setGlobalLoading(b: boolean) {
			this.globalLoading = b;
		},
		setGlobalFetching(b: boolean) {
			this.globalFetching = b;
		},
		setAppState(n: validAppStateNumb) {
			this.currentState = n;
		},
		setCurrentViewTitle(s: string) {
			this.currentViewTitle = s;
		},
	
		toggleSidebar() {
			this.sideBarMini = !this.sideBarMini;
		},
		triggerLogout(b: boolean) {
			this.onLogout = b;
		},
		
	},
});
