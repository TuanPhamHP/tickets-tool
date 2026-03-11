<template>
	<div
		class="rounded-full w-fit px-[6px] py-1 border text-md"
		:style="`color: ${statusColor.text}; background-color:${statusColor.background}`"
	>
		{{ vehicleStatusComputed.name }}
	</div>
</template>

<script lang="ts" setup>
	import type { Vehicle } from '@/models/Vehicle';

	const props = defineProps({
		vehicleData: { type: Object as PropType<Vehicle>, required: true },
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
	const statusColor = computed(() => {
		if (vehicleStatusComputed.value.id === 10 || vehicleStatusComputed.value.id === 20) {
			return {
				text: '#2AA749',
				background: '#E1F6E0',
			};
		}
		if (vehicleStatusComputed.value.id === 21) {
			return {
				text: '#2377FF',
				background: '#EFF6FF',
			};
		}
		if (vehicleStatusComputed.value.id === 30) {
			return {
				text: '#2377FF',
				background: '#EFF6FF',
			};
		}

		return {
			text: '#0C1941',
			background: '#D4DDEB',
		};
	});
</script>
