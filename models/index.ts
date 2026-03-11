const sameSite = [true, 'lax', 'strict', 'none', undefined] as const;
type sameSiteType = (typeof sameSite)[number];

export type StringOrNull = string | null;
export interface SimpleType {
	id: number;
	name: string;
}
export interface CookieOptions {
	maxAge: number;
	sameSite: sameSiteType;
}
export interface AuthUser {
	name: string;
	token: string;
	id: number;
	avatar?: string;
}
export interface NormalUser {
	avatar: StringOrNull;
	code: StringOrNull;
	email: StringOrNull;
	id: number | string;
	is_active: boolean;
	name: string;
	position: SimpleType | null;
}
export interface apiResponde {
	success: boolean;
	message: string;
	data: Record<string, any>;
	error_code?: string | null | number;
	status?: string | null | number;
}

export interface apiResponse<T> {
	success: boolean;
	message: string;
	data: T;
	error_code?: string | null | number;
	status?: string | null | number;
}
