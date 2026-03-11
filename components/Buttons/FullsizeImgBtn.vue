<template>
	<UTooltip text="Xem chi tiết">
		<img
			src="@/assets/icons/fullsize-icon.svg"
			class="absolute top-1 right-1 h-5 w-5 cursor-pointer fullsize-btn-icon"
			@click.stop="internalStore.setFullsizeImg(url)"
		/>
	</UTooltip>
</template>

<script lang="ts" setup>
	import { useInternalStore } from '@/store/internal';
	defineProps({
		url: { type: [String, null], required: true },
	});
	const internalStore = useInternalStore();
</script>
<style lang="scss" scopped>
	.fullsize-btn-icon {
		background-color: rgba(115, 115, 115, 0.535);
		border-radius: 2px;
		backdrop-filter: blur(4px);
	}
</style>
