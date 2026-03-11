<template>
	<UModal
		:open="open"
		:ui="{
			overlay: 'bg-black/40',
			title: 'text-center block w-full',
		}"
		:dismissible="false"
		title="Xác nhận xe đủ điều kiện"
		:close="false"
	>
		<template #body>
			<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
				<div class="mb-2">
					<p class="text-md text-center text-gray-700">
						Xác nhận xe VN:
						<span class="font-semibold text-gray-900">{{ vehicle?.plate_number }}</span>
						đã đủ điều kiện
						<br />
						Lưu ý: thao tác này không thể hoàn tác
					</p>
				</div>
			</div>
			<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
				<UButton
					as="button"
					variant="solid"
					class="cursor-pointer bg-primary-gradient min-w-[100px] w-full text-center justify-center inline-flex py-2"
					type="submit"
					color="primary"
					@click="handleSubmit"
					:loading="loadingDelete"
					trailing
				>
					Xác nhận
				</UButton>
				<UButton
					as="button"
					variant="outline"
					class="cursor-pointer min-w-[100px] w-full text-center justify-center inline-flex py-2"
					type="submit"
					color="neutral"
					@click="$emit('cancel-modal')"
					:disabled="loadingDelete"
					trailing
				>
					Không
				</UButton>
			</div>
		</template>
	</UModal>
</template>
<script lang="ts">
	import { ref } from 'vue';
	import type { Vehicle } from '../../models/Vehicle';
	import { useCustomToast } from '../../composable/useCustomToast';
	import type { ApiService } from '../../services/index';

	export default {
		setup() {
			const open = ref(false);
			const { successToast, errorToast } = useCustomToast();
			const config = useNuxtApp();
			const apiService = config.$api as ApiService;
			const loadingDelete = ref(false);
			return {
				open,
				apiService,
				loadingDelete,
				successToast,
				errorToast,
			};
		},
		props: {
			isOpen: {
				type: Boolean,
				default: false,
			},
			vehicle: {
				type: [Object, null] as PropType<Vehicle | null>,
				default() {
					return {};
				},
			},
		},
		watch: {
			isOpen() {
				this.open = this.isOpen;
			},
		},
		data() {
			return {};
		},
		methods: {
			handleSubmit() {
				if (!this.vehicle) {
					return;
				}
				this.loadingDelete = true;
				this.apiService.vehicle
					.confirmVehicleQC(this.vehicle.id)
					.then(
						res => {
							this.successToast({ title: `Xe ${this.vehicle?.plate_number}  được xác nhận ra bãi!` });
							this.$emit('updated');
						},
						err => {
							this.errorToast({ title: `Lỗi xác nhận xe: ${err}` });
						}
					)
					.finally(() => {
						this.loadingDelete = false;
					})
					.catch(err => {
						this.errorToast({ title: `Lỗi xử lý dữ liệu: ${err}` });
					});
			},
		},
	};
</script>
