export interface Permission {
	description: string;
	group: string;
	id: number;
	name: string;
}

export interface PermissionsByGroup {
	group: string;
	items: Permission[];
}
