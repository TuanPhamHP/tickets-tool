import { apiSuccess } from '../../utils/response';

export default defineEventHandler((event) => {
	deleteCookie(event, 'auth_token');
	return apiSuccess(null, 'Đăng xuất thành công');
});
