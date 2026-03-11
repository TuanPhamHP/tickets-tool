
import type { Vehicle } from './Vehicle';
type BaseApiResponse<T = unknown> = {
	data: T,
	isSuccess: boolean,
	message: string | null
}

type CreatePlateData = {
	id : string,
	plateNumber: string,
	createdAt:string
}

export type CreatePlateResponse = BaseApiResponse<CreatePlateData>;