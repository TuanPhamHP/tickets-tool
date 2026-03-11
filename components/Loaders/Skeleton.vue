<template>
	<div
		role="status"
		class="w-full p-4 space-y-4 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-400 md:p-6 dark:border-gray-400"
	>
		<div v-for="i in 10" :key="i" class="flex items-center justify-between pt-4">
			<div>
				<div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-400 w-24 mb-2.5"></div>
				<div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-400"></div>
			</div>
			<div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-400 w-12"></div>
		</div>
	</div>
</template>
<script>
	export default {};
</script>
