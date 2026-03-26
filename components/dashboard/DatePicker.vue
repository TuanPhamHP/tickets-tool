<script setup lang="ts">
import { subDays, subMonths, startOfYear, format, parseISO } from 'date-fns';

interface DateRange {
	from: string;
	to: string;
}

const model = defineModel<DateRange>({ required: true });
const isOpen = ref(false);

const presets = [
	{ label: '7 ngày qua', value: '7d' },
	{ label: '30 ngày qua', value: '30d' },
	{ label: '3 tháng qua', value: '3m' },
	{ label: 'Năm nay', value: 'ytd' },
];

const activePreset = ref('30d');

function applyPreset(preset: string) {
	const now = new Date();
	const to = format(now, 'yyyy-MM-dd');
	let from: string;

	switch (preset) {
		case '7d': from = format(subDays(now, 6), 'yyyy-MM-dd'); break;
		case '30d': from = format(subDays(now, 29), 'yyyy-MM-dd'); break;
		case '3m': from = format(subMonths(now, 3), 'yyyy-MM-dd'); break;
		case 'ytd': from = format(startOfYear(now), 'yyyy-MM-dd'); break;
		default: from = format(subDays(now, 29), 'yyyy-MM-dd');
	}

	activePreset.value = preset;
	model.value = { from, to };
	isOpen.value = false;
}

// Initialize with default (30 days)
onMounted(() => {
	if (!model.value?.from) applyPreset('30d');
});

const displayLabel = computed(() => {
	if (!model.value?.from || !model.value?.to) return 'Chọn khoảng thời gian';
	try {
		const from = parseISO(model.value.from);
		const to = parseISO(model.value.to);
		const fmt = (d: Date) => format(d, 'dd/MM/yyyy');
		const preset = presets.find(p => p.value === activePreset.value);
		if (preset) return `${preset.label} (${fmt(from)} – ${fmt(to)})`;
		return `${fmt(from)} – ${fmt(to)}`;
	} catch {
		return 'Khoảng thời gian';
	}
});
</script>

<template>
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex gap-1 flex-wrap">
			<button
				v-for="p in presets"
				:key="p.value"
				:class="[
					'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
					activePreset === p.value
						? 'text-white'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
				]"
				:style="activePreset === p.value ? 'background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%)' : ''"
				@click="applyPreset(p.value)"
			>
				{{ p.label }}
			</button>
		</div>

		<div class="text-sm text-gray-400 hidden sm:block">|</div>

		<p class="text-sm text-gray-600 font-medium">{{ displayLabel }}</p>
	</div>
</template>
