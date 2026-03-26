<script setup lang="ts">
import { Bar } from 'vue-chartjs';

interface Dataset {
	label: string;
	data: number[];
	color?: string;
}

const props = defineProps<{
	labels: string[];
	datasets: Dataset[];
	title?: string;
	horizontal?: boolean;
	stacked?: boolean;
	height?: number;
}>();

const defaultColors = [
	'#10b981', '#3b82f6', '#f59e0b', '#ef4444',
	'#8b5cf6', '#14b8a6', '#f97316', '#6b7280',
];

const chartData = computed(() => ({
	labels: props.labels,
	datasets: props.datasets.map((ds, i) => ({
		label: ds.label,
		data: ds.data,
		backgroundColor: ds.color || defaultColors[i % defaultColors.length],
		borderRadius: props.horizontal ? 0 : 4,
		borderSkipped: false,
	})),
}));

const chartOptions = computed(() => ({
	responsive: true,
	maintainAspectRatio: false,
	indexAxis: props.horizontal ? ('y' as const) : ('x' as const),
	plugins: {
		legend: {
			display: props.datasets.length > 1,
			position: 'bottom' as const,
			labels: { padding: 16, usePointStyle: true, font: { size: 12 } },
		},
		tooltip: props.horizontal
			? { mode: 'index' as const, intersect: false, axis: 'y' as const }
			: { mode: 'index' as const, intersect: false },
	},
	scales: {
		x: {
			stacked: props.stacked,
			grid: { display: !props.horizontal },
			ticks: { font: { size: 11 } },
		},
		y: {
			stacked: props.stacked,
			beginAtZero: true,
			grid: { display: props.horizontal },
			ticks: { font: { size: 11 } },
		},
	},
}));
</script>

<template>
	<div class="bg-white rounded-xl border border-gray-200 p-5">
		<p v-if="title" class="text-sm font-semibold text-gray-700 mb-4">{{ title }}</p>
		<div class="w-full" :style="{ height: (height || 260) + 'px' }">
			<Bar :data="chartData" :options="chartOptions" />
		</div>
	</div>
</template>
