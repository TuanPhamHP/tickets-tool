import type { apiResponde, apiResponse } from '@/models';
import type { Vehicle } from '@/models/Vehicle';
import { useAuthHeader } from '~/composable/api';

type listResponse = apiResponse<{
	meta: { pagination: Record<string, string | number> };
	vehicles: Vehicle[];
}>;
type exportResponse = apiResponse<{
	url: string;
}>;
const base = (API_BASE_URL: String) => {
	const authCookie = useCookie('auth-token');
	return {
		getListData(payload?: Record<string, any>): Promise<listResponse> {
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		updatePlate(id: string | number, payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles/${id}`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},
		createPlate(payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},
		confirmVehicleQC(id: string | number, payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles/${id}/confirm-vehicle-eligible`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},
		confirmVehicleOut(id: string | number, payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles/${id}/confirm-vehicle-out`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},
		confirmVehicleEnterXC(id: string | number, payload?: Record<string, any>): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles/${id}/confirm-vehicle-enter-xc`, {
				method: 'POST',
				body: payload,
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},
		deleteVehicle(id: string | number): Promise<apiResponde> {
			const authCookie = useCookie('auth-token');
			return $fetch(`${API_BASE_URL}/api/user/parking/vn-vehicles/${id}`, {
				method: 'DELETE',
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			});
		},

		exportXeTrongBai83(payload?: Record<string, any>): Promise<exportResponse> {
			return $fetch(`${API_BASE_URL}/api/user/report/parking-83/bao-cao-xe-trong-bai-xc`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		exportXeDuDK(payload?: Record<string, any>): Promise<exportResponse> {
			return $fetch(`${API_BASE_URL}/api/user/report/parking-83/bao-cao-xe-du-dieu-kien`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
		exportXeDaVaoBai(payload?: Record<string, any>): Promise<exportResponse> {
			return $fetch(`${API_BASE_URL}/api/user/report/parking-83/bao-cao-xe-da-vao-bai`, {
				method: 'GET',
				query: { ...payload },
				headers: {
					authorization: `${authCookie.value ? `Bearer ${authCookie.value}` : useAuthHeader()}`,
				},
			} as any);
		},
	};
};

export default base;
