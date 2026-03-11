export function apiSuccess<T>(data: T, message?: string) {
	return {
		success: true,
		message: message ?? 'Thành công',
		data,
	};
}

export function apiPaginated<T>(items: T[], total: number, page: number, limit: number) {
	return {
		success: true,
		data: items,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export function getPagination(query: Record<string, string | string[] | undefined>) {
	const page = Math.max(1, Number(query.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
	const offset = (page - 1) * limit;
	return { page, limit, offset };
}
