<template>
	<div id="appFetching">
		<div>
			<Icon name="mingcute:loading-fill" class="text-white animate-spin" size="42px" />
		</div>
	</div>
</template>

<script lang="ts">
	export default {
		setup() {},
	};
</script>

<style lang="scss" scoped>
	#appFetching {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #00000021;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100vw;
		height: 100vh;
		z-index: 9999;
		pointer-events: none;
	}
</style>
