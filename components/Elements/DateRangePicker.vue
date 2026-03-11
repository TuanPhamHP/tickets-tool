<script setup lang="ts">
	import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date';

	const value = defineModel<{
		start: any;
		end: any;
	}>('modelValue');

	const df = new DateFormatter('vi-VN', {
		dateStyle: 'medium',
	});
	const tz = getLocalTimeZone();
	const current = today(tz);

	if (!value.value) {
		value.value = {
			start: current,
			end: current,
		};
	}

	const isOpen = ref(false);

	watch(value, newVal => {
		if (newVal?.start && newVal?.end) {
			isOpen.value = false;
		}
	});

	const clearDate = () => {
		value.value = {
			start: null,
			end: null,
		};
	};
</script>

<template>
	<UPopover v-model:open="isOpen">
		<UButton
			color="neutral"
			variant="subtle"
			icon="i-lucide-calendar"
			class="w-full bg-white py-3 cursor-pointer hover:bg-gray-200/50"
		>
			<template v-if="value && value.start">
				<template v-if="value.end">
					{{ df.format(value.start.toDate(getLocalTimeZone())) }} -
					{{ df.format(value.end.toDate(getLocalTimeZone())) }}
				</template>

				<template v-else>
					{{ df.format(value.start.toDate(getLocalTimeZone())) }}
				</template>
				<button class="cursor-pointer mr-3 ml-auto" @click="clearDate">
					<img src="@/assets/icons/close-red.svg" class="w-[24px] min-w-[24px]" />
				</button>
			</template>
			<template v-else> Chọn ngày </template>
		</UButton>

		<template #content>
			<UCalendar v-model="value" class="p-2" :number-of-months="2" range locale="vi-VN" />
			<div class="flex justify-end mt-2">
				<UButton size="xs" variant="ghost" color="neutral" @click="clearDate"> Xóa ngày </UButton>
			</div>
		</template>
	</UPopover>
</template>
