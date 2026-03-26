<script setup lang="ts">
import { Line } from 'vue-chartjs';

interface Dataset {
	label: string;
	data: number[];
	color?: string;
}

const props = defineProps<{
	labels: string[];
	datasets: Dataset[];
	title?: string;
	fill?: boolean;
	height?: number;
}>();

const defaultColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const chartData = computed(() => ({
	labels: props.labels,
	datasets: props.datasets.map((ds, i) => {
		const color = ds.color || defaultColors[i % defaultColors.length];
		return {
			label: ds.label,
			data: ds.data,
			borderColor: color,
			backgroundColor: props.fill ? color + '20' : color + '00',
			pointBackgroundColor: color,
			pointRadius: 4,
			pointHoverRadius: 6,
			fill: !!props.fill,
			tension: 0.3,
			borderWidth: 2,
		};
	}),
}));

const chartOptions = computed(() => ({
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: props.datasets.length > 1,
			position: 'bottom' as const,
			labels: { padding: 16, usePointStyle: true, font: { size: 12 } },
		},
		tooltip: { mode: 'index' as const, intersect: false },
	},
	scales: {
		x: {
			grid: { display: false },
			ticks: { font: { size: 11 } },
		},
		y: {
			beginAtZero: true,
			grid: { color: '#f3f4f6' },
			ticks: { font: { size: 11 }, precision: 0 },
		},
	},
}));
</script>

<template>
	<div class="bg-white rounded-xl border border-gray-200 p-5">
		<p v-if="title" class="text-sm font-semibold text-gray-700 mb-4">{{ title }}</p>
		<div class="w-full" :style="{ height: (height || 260) + 'px' }">
			<Line :data="chartData" :options="chartOptions" />
		</div>
	</div>
</template>
