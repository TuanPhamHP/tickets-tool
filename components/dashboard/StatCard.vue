<script setup lang="ts">
const props = defineProps<{
	title: string;
	value: number | string;
	previousValue?: number;
	subtitle?: string;
	icon?: string;
	highlight?: 'amber' | 'red' | 'green' | 'blue';
	loading?: boolean;
}>();

const delta = computed(() => {
	if (props.previousValue === undefined || props.previousValue === null) return null;
	const curr = Number(props.value);
	const prev = Number(props.previousValue);
	if (prev === 0) return curr > 0 ? 100 : 0;
	return Math.round(((curr - prev) / prev) * 100);
});

const highlightClass = computed(() => {
	if (!props.highlight) return 'bg-white border-gray-200';
	return {
		amber: 'bg-amber-50 border-amber-200',
		red: 'bg-red-50 border-red-200',
		green: 'bg-green-50 border-green-200',
		blue: 'bg-blue-50 border-blue-200',
	}[props.highlight];
});

const iconBgClass = computed(() => {
	if (!props.highlight) return 'bg-gray-100 text-gray-500';
	return {
		amber: 'bg-amber-100 text-amber-600',
		red: 'bg-red-100 text-red-600',
		green: 'bg-green-100 text-green-600',
		blue: 'bg-blue-100 text-blue-600',
	}[props.highlight];
});
</script>

<template>
	<div :class="['rounded-xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md', highlightClass]">
		<div class="flex items-start justify-between gap-2">
			<p class="text-sm font-medium text-gray-500 leading-snug">{{ title }}</p>
			<div v-if="icon" :class="['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBgClass]">
				<UIcon :name="icon" class="text-lg" />
			</div>
		</div>

		<div v-if="loading" class="h-9 w-24 bg-gray-200 animate-pulse rounded-md" />
		<div v-else class="flex items-end gap-3">
			<p class="text-3xl font-bold text-gray-900 leading-none">{{ value }}</p>

			<div v-if="delta !== null" :class="[
				'flex items-center gap-0.5 text-sm font-medium pb-0.5',
				delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400',
			]">
				<UIcon
					:name="delta > 0 ? 'i-heroicons-arrow-trending-up' : delta < 0 ? 'i-heroicons-arrow-trending-down' : 'i-heroicons-minus'"
					class="text-base"
				/>
				<span>{{ Math.abs(delta) }}%</span>
			</div>
		</div>

		<p v-if="subtitle" class="text-xs text-gray-400">{{ subtitle }}</p>
	</div>
</template>
