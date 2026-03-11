<template>
	<div id="appIndicator" :class="safeToView ? 'gonna-fade' : ''">
		<div>
			<img :src="sideBarLogoExpand" class="block mb-5" alt="" />
			<p>{{ appStateMessage }}</p>
		</div>
	</div>
</template>

<script lang="ts">
	import { computed } from 'vue';
	import { storeToRefs } from 'pinia';
	import { useAppStateStore } from '../../store/appState';
	export default {
		setup() {
			const { globalLoading, currentState, fetchingPermisson } = storeToRefs(useAppStateStore());
			const appStateMessage = computed(() => {
				if (globalLoading.value) {
					return 'Khởi tạo hệ thống ....';
				}
				// switch (currentState.value) {
				// 	case 0:
				// 		return 'Errors';
				// 	case 1:
				// 		return 'Check Auth';
				// 	case 2:
				// 		return 'Fetching Data';
				// 	case 3:
				// 		return 'Ready';

				// 	default:
				// 		return 'Unknow';
				// }
				switch (fetchingPermisson.value) {
					case 0:
						return `Đang lấy quyền của tài khoản`;
					case 1:
						return `Lấy quyền tài khoản hoàn tất`;
					case 2:
						return `Lấy quyền tài khoản thất bại`;
					default:
						return 'Unknow';
				}
			});

			const config = useRuntimeConfig();
			const { sideBarLogoExpand } = config.public;
			return {
				globalLoading,
				currentState,
				appStateMessage,
				sideBarLogoExpand,
			};
		},
		props: {
			safeToView: {
				type: Boolean,
				default: false,
			},
		},
		updated() {
			setTimeout(() => {
				if (this.safeToView) {
					document.querySelector('#appIndicator')?.remove();
				}
			}, 1000);
		},
		mounted() {
			setTimeout(() => {
				if (this.safeToView) {
					document.querySelector('#appIndicator')?.remove();
				}
			}, 1000);
		},
		watch: {
			safeToView() {
				if (this.safeToView) {
					setTimeout(() => {
						document.querySelector('#appIndicator')?.remove();
					}, 1000);
				}
			},
		},
	};
</script>

<style lang="scss" scoped>
	#appIndicator {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #000;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 99;
		transform: translateX(0px);
		transition: 0.5s ease;
		&.gonna-fade {
			/* transform: translateX(120px); */
			opacity: 0.9;
			/* z-index: -1; */
		}
	}
</style>
