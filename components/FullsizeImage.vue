<template>
	<div ref="my-fullsize-img-wrapper" tabindex="1" @keydown.exact.esc="internalStore.setFullsizeImg(null)">
		<div
			v-if="internalStore.$state.fullsizeImg"
			class="w-screen h-screen fixed top-0 left-0 z-10 fullsize-wrapper flex items-center justify-center"
		>
			<div class="relative img-wrp flex items-center justify-center w-fit h-git">
				<UTooltip text="Đóng">
					<img
						src="@/assets/icons/close-circle-red.svg"
						class="btn-close absolute top-1 right-1 h-5 w-5 cursor-pointer"
						@click="internalStore.setFullsizeImg(null)"
					/>
				</UTooltip>
				<img :src="fullsizeImg || ''" class="fullsize-img" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { useInternalStore } from '@/store/internal';
	const wrapper = useTemplateRef('my-fullsize-img-wrapper');
	const internalStore = useInternalStore();
	const fullsizeImg = computed(() => internalStore.$state.fullsizeImg);
	watch(fullsizeImg, newVal => {
		if (newVal) {
			setTimeout(() => {
				wrapper.value?.focus();
			}, 100);
		}
	});
</script>

<style lang="scss" scoped>
	.fullsize-wrapper {
		background-color: rgba(75, 75, 75, 0.418);
		backdrop-filter: blur(3px);
	}
	.fullsize-img {
		width: auto;
		height: auto;
		max-width: 90vw;
		max-height: 90vh;
		object-fit: contain;
	}
</style>
