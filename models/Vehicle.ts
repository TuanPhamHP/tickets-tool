import type { SimpleType, StringOrNull } from '@/models';

export type CarDetail = {
	id: string | number;
	plate: string | null;
	image?: string | null;
};

export interface Vehicle {
	id: number | string;
	plate_number: string;
	short_plate_number: string;
	cn_plate_number: StringOrNull;
	created_at: string;
	updated_at: string;
	time_out: StringOrNull;
	time_in: StringOrNull;
	status: {
		id: number | string;
		name: string;
		// color: {
		// 	text: string;
		// 	background: string;
		// };
	};
	service_type: {
		id: number | string;
		label: string;
	};
	can_be_confirmed_vehicle_out: boolean;
	can_be_deleted: boolean;
	can_be_edited: boolean;
	parking_time: number | null;
	parking_time_display: string | null;
	parking_minutes: number | null;
}

export interface ParkingEventResponse {
	data: Vehicle[];
	pageIndex: number;
	pageSize: number;
	totalCount: number;
	totalPage: number;
}
