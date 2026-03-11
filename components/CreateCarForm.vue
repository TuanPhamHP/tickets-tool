<template>
	<div class="bg-white rounded-lg py-4 px-6">
		<p class="font-semibold text-lg mb-3 text-left">Thêm xe mới vào bãi</p>
		<div
			:class="`plate-block mx-auto flex items-center gap-2 py-1 px-1 border bg-white border-[#2E7D32] rounded-lg mb-3`"
		>
			<input
				v-model="plate"
				type="text"
				class="w-full outline-0 border-0 block text-sm text-gray-900 pl-3 uppercase"
				placeholder="Nhập biển số xe VN"
			/>
			<UButton
				as="button"
				@click="handleCreate"
				:loading="loadingCreate"
				class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[150px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
				type="submit"
				trailing
			>
				<span>Thêm xe </span>
			</UButton>
		</div>

		<!-- <USelect v-model="service" value-key="id" :items="listServices" arrow placeholder="Chọn loại dịch vụ" class="w-48" /> -->
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
			}"
		/>
	</div>
</template>

<script lang="ts" setup>
	import { useCustomToast } from '@/composable/useCustomToast';
	import { useInternalStore } from '@/store/internal';
	import type { ApiService } from '@/services/index';
	const emit = defineEmits(['created']);
	const { successToast, errorToast } = useCustomToast();

	const loadingCreate = ref<boolean>(false);
	const plate = ref<string>('');
	const service = ref('');
	const internalStore = useInternalStore();
	const listServices = computed(() => internalStore.$state.listServices);
	const minLength = ref<number>(5);

	const config = useNuxtApp();
	const $api = config.$api as ApiService;

	const clearData = () => {
		plate.value = '';
		service.value = '';
	};
	const handleCreate = () => {
		if (!plate.value.trim() || plate.value.trim().length < minLength.value) {
			errorToast({ description: `Nhập ít nhất ${minLength.value} ký tự để thêm` });
			return;
		}
		loadingCreate.value = true;
		const body = {
			plate_number: String(plate.value).toUpperCase().trim(),
			service_type_id: service.value || '',
		};
		$api.vehicle
			.createPlate(body)
			.then(
				res => {
					successToast({ title: `Thêm xe ${plate.value} thành công!` });
					clearData();
					emit('created');
				},
				err => {
					errorToast({ title: `Lỗi thêm xe: ${err.response?._data?.message || err}` });
				}
			)
			.finally(() => {
				loadingCreate.value = false;
			})
			.catch(err => {
				errorToast({ title: `Lỗi xử lý dữ liệu: ${err}` });
			});
	};
</script>
