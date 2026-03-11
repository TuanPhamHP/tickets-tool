<template>
	<div class="rounded-lg border border-gray-300 px-4 py-3 hover:border-green-700 hover:shadow hover:bg-green-700/5">
		<div class="flex items-center justify-between">
			<div class="text-left">
				<p class="font-semibold text-lg text-dark">{{ vehicleData.plate_number }}</p>
				<p class="text-md text-gray-600">
					Xe VN {{ vehicleData.service_type ? `| Dịch vụ: ${vehicleData.service_type?.label}` : '' }}
				</p>
			</div>
			<div class="flex items-center gap-1">
				<VehicleStatusBadget :vehicleData="vehicleData" />
				<UTooltip v-if="ableToEdit" text="Sửa">
					<UButton
						as="button"
						class="hover:bg-gray-100 px-1 cursor-pointer"
						variant="ghost"
						trailing
						@click="setSelectedVehicle(vehicleData)"
					>
						<img src="@/assets/icons/edit.svg" />
					</UButton>
				</UTooltip>
				<UTooltip v-if="ableToDelete" text="Xóa">
					<UButton
						as="button"
						class="hover:bg-gray-100 px-1 cursor-pointer"
						variant="ghost"
						trailing
						@click="setSelectedVehicleToDelete(vehicleData)"
					>
						<img src="@/assets/icons/trash.svg" />
					</UButton>
				</UTooltip>
			</div>
		</div>
		<div class="border-b border-gray-200 my-2"></div>
		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-3">
				<div v-if="vehicleData.time_in" class="text-left">
					<p class="text-md">Thời gian vào:</p>
					<p class="fw-500">{{ format(vehicleData.time_in, 'HH:mm:ss | dd/MM/yyyy') }}</p>
				</div>
				<div v-if="vehicleData.time_out" class="text-left">
					<p class="text-md">Thời gian ra:</p>
					<p class="fw-500">{{ format(vehicleData.time_out, 'HH:mm:ss | dd/MM/yyyy') }}</p>
				</div>
				<div v-if="vehicleData.parking_time_display" class="text-left">
					<p class="text-md">Thời gian lưu bãi:</p>
					<p class="fw-500">{{ vehicleData.parking_time_display }}</p>
				</div>
				<div v-if="ableToConfirm" class="text-left">
					<UButton
						as="button"
						class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[150px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
						type="submit"
						trailing
						:loading="loadingConfirm"
						:disabled="loadingConfirm"
						@click="setSelectedVehicleToRelease(vehicleData)"
					>
						<span>Xác nhận xe đã ra bãi </span>
					</UButton>
				</div>
			</div>
			<div class="flex flex-col gap-3">
				<div v-if="vehicleData.cn_plate_number" class="text-left">
					<p class="text-md">Xe TQ đối ứng:</p>
					<p class="fw-500">{{ vehicleData.cn_plate_number }}</p>
				</div>
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
	import type { Vehicle } from '~/models/Vehicle';
	import type { PropType } from 'vue';
	import VehicleStatusBadget from './VehicleStatusBadget.vue';
	import { format } from 'date-fns';
	import type { ApiService } from '../services/index';
	import { useCustomToast } from '../composable/useCustomToast';
	const props = defineProps({
		vehicleData: { type: Object as PropType<Vehicle>, required: true },
		setSelectedVehicle: { type: Function, required: true },
		setSelectedVehicleToDelete: { type: Function, required: true },
		setSelectedVehicleToRelease: { type: Function, required: true },
	});
	const { successToast, errorToast } = useCustomToast();
	const config = useNuxtApp();
	const $api = config.$api as ApiService;
	const emit = defineEmits(['submited']);
	const loadingConfirm = ref<boolean>(false);
	const ableToConfirm = computed(() => {
		return !props.vehicleData.time_out && props.vehicleData.status.id === 20;
	});
	const ableToEdit = computed(() => {
		return props.vehicleData.status.id === 10;
	});
	const ableToDelete = computed(() => {
		return props.vehicleData.status.id === 10;
	});
	const vehicleStatusComputed = computed(() => {
		const status = props.vehicleData.status;
		if (status.id === 20 && props.vehicleData.time_out) {
			return {
				id: 21,
				name: 'Đã ra khỏi bãi',
			};
		}
		return status;
	});
</script>
