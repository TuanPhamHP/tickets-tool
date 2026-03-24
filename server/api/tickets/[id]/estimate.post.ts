/**
 * @deprecated Endpoint này đã được thay thế bởi /api/tickets/:id/review
 * Xem review.post.ts để biết thêm chi tiết về luồng mới.
 */
export default defineEventHandler(async (_event) => {
	throw createError({ statusCode: 410, statusMessage: 'Endpoint này đã lỗi thời. Vui lòng dùng POST /api/tickets/:id/review' });
});
