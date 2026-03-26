<script setup lang="ts">
import { Doughnut } from 'vue-chartjs';

const props = defineProps<{
	labels: string[];
	data: number[];
	colors?: string[];
	title?: string;
}>();

const defaultColors = [
	'#6b7280',
	'#3b82f6',
	'#f59e0b',
	'#10b981',
	'#14b8a6',
	'#ef4444',
	'#8b5cf6',
	'#f97316',
];

const chartData = computed(() => ({
	labels: props.labels,
	datasets: [{
		data: props.data,
		backgroundColor: props.colors || defaultColors.slice(0, props.data.length),
		borderWidth: 2,
		borderColor: '#fff',
		hoverBorderWidth: 0,
	}],
}));

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom' as const,
			labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } },
		},
		tooltip: {
			callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}` },
		},
	},
};
</script>

<template>
	<div class="bg-white rounded-xl border border-gray-200 p-5">
		<p v-if="title" class="text-sm font-semibold text-gray-700 mb-4">{{ title }}</p>
		<div class="w-full" style="height: 260px">
			<Doughnut :data="chartData" :options="chartOptions" />
		</div>
	</div>
</template>
