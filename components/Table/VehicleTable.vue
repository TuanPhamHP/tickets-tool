<template>
	<table class="w-full">
		<thead class="sticky top-0 z-10">
			<tr class="rounded-xl overflow-hidden bg-[#EEF0F5] target-td">
				<td class="py-2">STT</td>
				<td class="py-2">Xe</td>
				<td class="py-2" v-if="tabNo !== 10">Xe TQ đối ứng</td>
				<td class="py-2">Dịch vụ</td>
				<td class="py-2">Trạng thái</td>
				<td class="py-2">Thời gian vào</td>
				<td class="py-2" v-if="tabNo === 20 || tabNo === 30">Thời gian ra</td>
				<td class="py-2" v-if="tabNo === 20 || tabNo === 30">Thời gian lưu bãi</td>
				<td class="py-2" v-if="tabNo !== 30">Hành động</td>
			</tr>
		</thead>
		<tbody>
			<tr
				v-for="(item, index) in listData"
				:key="item.id"
				class="border-b-1 border-gray-200 hover:bg-green-700/10 text-sm"
			>
				<td class="py-2">
					{{ index + 1 }}
				</td>
				<td class="py-2">
					{{ item.plate_number || '-/-' }}
				</td>
				<td v-if="tabNo !== 10" class="py-2">
					{{ item.cn_plate_number || '-/-' }}
				</td>
				<td class="py-2">
					{{ item.service_type?.label || '-/-' }}
				</td>
				<td class="py-2">
					<div class="flex justify-center items-center">
						<VehicleStatusBadget :vehicleData="item" />
					</div>
				</td>
				<td class="py-2">
					<div class="flex justify-center items-center">
						<p class="w-20 text-left">
							{{ item.time_in ? format(item.time_in, 'HH:mm:ss dd/MM/yyyy') : '-/-' }}
						</p>
					</div>
				</td>
				<td v-if="tabNo === 20 || tabNo === 30" class="py-2">
					<div class="flex justify-center items-center">
						<p class="w-20 text-left">
							{{ item.time_out ? format(item.time_out, 'HH:mm:ss dd/MM/yyyy') : '-/-' }}
						</p>
					</div>
				</td>
				<td v-if="tabNo === 20 || tabNo === 30" class="py-2">
					{{ getParkingTimeDisplay(item) }}
				</td>
				<td v-if="tabNo !== 30">
					<div class="flex items-center justify-center gap-2">
						<UTooltip v-if="ableToEdit" text="Xác nhận xe đủ điều kiện">
							<UButton
								as="button"
								class="hover:bg-white px-1 cursor-pointer"
								variant="ghost"
								trailing
								@click="setSelectedVehicleToQC(item)"
							>
								<img src="@/assets/icons/check-circle.svg" />
							</UButton>
						</UTooltip>
						<UTooltip v-if="ableToEdit" text="Sửa">
							<UButton
								as="button"
								class="hover:bg-white px-1 cursor-pointer"
								variant="ghost"
								trailing
								@click="setSelectedVehicle(item)"
							>
								<img src="@/assets/icons/edit-orange.svg" />
							</UButton>
						</UTooltip>
						<UTooltip v-if="ableToDelete" text="Xóa">
							<UButton
								as="button"
								class="hover:bg-white px-1 cursor-pointer"
								variant="ghost"
								trailing
								@click="setSelectedVehicleToDelete(item)"
							>
								<img src="@/assets/icons/trash.svg" />
							</UButton>
						</UTooltip>

						<UButton
							v-if="ableToRelease && !item.time_out"
							as="button"
							class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[150px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
							type="submit"
							trailing
							@click="setSelectedVehicleToRelease(item)"
						>
							<span>Xác nhận xe đã ra bãi </span>
						</UButton>
						<UButton
							v-if="ableToRelease && item.time_out"
							as="button"
							class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[150px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
							type="submit"
							trailing
							@click="setSelectedVehicleToEnterXC(item)"
						>
							<span>Xác nhận xe đã vào bãi XC </span>
						</UButton>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
</template>
<script lang="ts" setup>
	import { format } from 'date-fns';
	import type { Vehicle } from '@/models/Vehicle';
	import VehicleStatusBadget from '../VehicleStatusBadget.vue';
	const props = defineProps({
		listData: { type: Array as PropType<Vehicle[]>, required: true },
		tabNo: { type: Number, required: true },
		setSelectedVehicle: { type: Function, required: true },
		setSelectedVehicleToDelete: { type: Function, required: true },
		setSelectedVehicleToRelease: { type: Function, required: true },
		setSelectedVehicleToQC: { type: Function, required: true },
		setSelectedVehicleToEnterXC: { type: Function, required: true },
	});

	const ableToEdit = computed(() => {
		return props.tabNo === 10;
	});
	const ableToDelete = computed(() => {
		return props.tabNo === 10;
	});
	const ableToRelease = computed(() => {
		return props.tabNo === 20;
	});

	const getParkingTimeDisplay = (vehicle: Vehicle) => {
		try {
			let str = '-/-';
			if (vehicle.parking_minutes) {
				str = vehicle.parking_time_display || '-/-';
			} else if (vehicle.parking_minutes === 0) {
				str = '< 1 phút';
			} else {
				const timeIn = new Date(vehicle.time_in || '');
				const now = new Date();
				const diff = now.getTime() - timeIn.getTime();
				const minutes = Math.floor(diff / 1000 / 60);
				const hours = Math.floor(minutes / 60);
				const remainingMinutes = minutes % 60;
				if (hours > 0) {
					str = `${hours} giờ ${remainingMinutes} phút`;
				} else {
					str = `${remainingMinutes} phút`;
				}
			}
			return str;
		} catch (error) {
			return '-/-';
		}
	};
</script>
<style lang="scss">
	.target-td {
		td:first-child {
			border-top-left-radius: 8px;
			border-bottom-left-radius: 8px;
		}
		td:last-child {
			border-top-right-radius: 8px;
			border-bottom-right-radius: 8px;
		}
	}
</style>
