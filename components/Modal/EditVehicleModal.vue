<template>
	<UModal
		ref="EditVehicleModal"
		:open="open"
		:ui="{
			overlay: 'bg-black/40',
		}"
		:dismissible="false"
		:close="false"
		title="Chỉnh sửa thông tin xe"
	>
		<template #body>
			<div class="mt-3 text-center sm:mt-0 sm:text-left">
				<UFormField class="mb-3" label="Biển số xe" :size="'xl'">
					<UInput v-model="plate" placeholder="Biển số xe" class="w-full uppercase" />
				</UFormField>

				<URadioGroup
					v-model="service"
					value-key="id"
					orientation="horizontal"
					variant="list"
					default-value="''"
					:items="listServices"
					:ui="{
						item: 'cursor-pointer ml-1 rounded px-1 py-1 hover:inset-1 hover:bg-green-700/10 ring ring-gray-200',
						label: 'cursor-pointer  ',
						fieldset: 'flex flex-wrap gap-2',
					}"
				/>
			</div>
			<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2 gap-2">
				<UButton
					as="button"
					@click="handleUpdate"
					:loading="loadingUpdate"
					variant="solid"
					class="bg-primary-gradient w-full cursor-pointer min-w-[100px] text-center justify-center inline-flex"
					type="submit"
					trailing
				>
					Lưu
				</UButton>
				<UButton
					as="button"
					variant="outline"
					class="cursor-pointer min-w-[100px] w-full text-center justify-center inline-flex py-2"
					type="submit"
					color="neutral"
					@click="$emit('cancel-modal')"
					:disabled="loadingUpdate"
					trailing
				>
					Huỷ
				</UButton>
			</div>
		</template>
	</UModal>
</template>
<script lang="ts">
	import { ref, type PropType } from 'vue';
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useAppStateStore } from '@/store/appState';
	import type { Vehicle } from '@/models/Vehicle';
	import { useInternalStore } from '../../store/internal';
	import { useCustomToast } from '../../composable/useCustomToast';
	import type { ApiService } from '@/services/index';

	export default {
		setup() {
			const { successToast, errorToast } = useCustomToast();
			const config = useNuxtApp();
			const apiService = config.$api as ApiService;
			// const emit = defineEmits(['updated']);
			const open = ref(false);
			const loadingUpdate = ref(false);
			const plate = ref('');
			const service = ref('');
			const internalStore = useInternalStore();
			const listServices = computed(() => internalStore.$state.listServices);
			const minLength = ref<number>(5);

			return {
				open,
				plate,
				service,
				listServices,
				loadingUpdate,
				minLength,
				successToast,
				errorToast,
				apiService,
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
			vehicle: {
				immediate: true,
				handler(newVal) {
					if (newVal) {
						this.plate = newVal.plate_number || '';
						this.service = newVal.service_type?.id || '';
					}
				},
			},
		},
		data() {
			return {};
		},
		methods: {
			handleUpdate() {
				if (!this.vehicle) {
					return;
				}
				if (!this.plate.trim() || this.plate.trim().length < this.minLength) {
					this.errorToast({ description: `Nhập ít nhất ${this.minLength} ký tự để thêm` });
					return;
				}
				this.loadingUpdate = true;
				const body = {
					plate_number: String(this.plate).toUpperCase().trim(),
					service_type_id: this.service || '',
				};
				this.apiService.vehicle
					.updatePlate(this.vehicle.id, body)
					.then(
						res => {
							this.successToast({ title: `Sửa thông tin xe ${this.plate} thành công!` });
							this.$emit('updated');
						},
						err => {
							this.errorToast({ title: `Lỗi sửa xe: ${err}` });
						}
					)
					.finally(() => {
						this.loadingUpdate = false;
					})
					.catch(err => {
						this.errorToast({ title: `Lỗi xử lý dữ liệu: ${err}` });
					});
			},
		},
	};
</script>
