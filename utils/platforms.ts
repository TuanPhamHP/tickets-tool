export const PLATFORM_OPTIONS = [
	{ value: 'web_khach_hang', label: 'Web Khách hàng' },
	{ value: 'app_giao_dich', label: 'App Giao dịch' },
	{ value: 'app_dieu_phoi', label: 'App Điều phối' },
	{ value: 'app_to_doi', label: 'App Tổ đội' },
	{ value: 'app_coi_bat', label: 'App Cởi bạt' },
] as const;

export type PlatformValue = (typeof PLATFORM_OPTIONS)[number]['value'];

export function getPlatformLabel(value: string): string {
	return PLATFORM_OPTIONS.find(p => p.value === value)?.label ?? value;
}
