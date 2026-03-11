import type { Permission } from '@/models/Permission';
import { defineStore } from 'pinia';

interface InternalStoreState {
	fullsizeImg: string | null;
	listServices: Record<string, string>[];
	listPermission: Permission[];
	authUserPermissions: Permission[];
	advancedFilter: Record<string, any>[];
}

export const useInternalStore = defineStore('internal', {
	state: (): InternalStoreState => ({
		fullsizeImg: null,
		listServices: [
			{
				id: 'pallet',
				label: 'Pallet kéo tay',
				filterName: 'Pallet kéo tay',
			},
			{
				id: 'forklift',
				label: 'Pallet nâng bục',
				filterName: 'Pallet nâng bục',
			},
			{
				id: 'craning',
				label: 'Cẩu hàng',
				filterName: 'Cẩu hàng',
			},
			// {
			// 	id: 'container',
			// 	label: 'Gắp container',
			// 	filterName: 'Gắp container'
			// },
			{
				id: 'loading',
				label: 'Bốc xếp',
				filterName: 'Bốc xếp',
			},
			{
				id: 'roof',
				label: 'Mái che',
				filterName: 'Mái che',
			},
			{
				id: 'container_craning',
				label: 'Cẩu Container',
			},
		],
		listPermission: [] as Permission[],
		authUserPermissions: [] as Permission[],
		advancedFilter: [] as Record<string, any>[],
	}),
	actions: {
		setFullsizeImg(url: string | null) {
			this.fullsizeImg = url;
		},
		setAuthPermissions(payload: Permission[]) {
			this.authUserPermissions = payload;
		},
		setAdvancedFilter(filter: Record<string, any>) {
			// lọc filter theo tab để push hoặc splice
			const index = this.advancedFilter.findIndex(f => f.tab === filter.tab);
			if (index !== -1) {
				this.advancedFilter.splice(index, 1, filter);
			} else {
				this.advancedFilter.push(filter);
			}
		},
	},
});
