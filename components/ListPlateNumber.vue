<template>
	<div class="bg-white rounded-lg py-4 px-6">
		<div class="font-semibold text-lg mb-3 text-left flex items-center gap-2">
			{{ tabTitle }}
			<UButton
				as="button"
				@click="handleSearch(false)"
				:loading="loadingSearch"
				variant="ghost"
				class="bg-primary-gradient cursor-pointer"
				type="submit"
				trailing
			>
				<img src="@/assets/icons/refresh-ccw.svg" class="h-4" />
			</UButton>
		</div>
		<div class="flex gap-2">
			<div
				:class="`plate-block mx-auto flex items-center gap-2 py-1 px-1 border bg-white border-[#2E7D32] rounded-lg w-full`"
			>
				<img src="@/assets/icons/search-md.svg" class="w-[24px] min-w-[24px]" />

				<input
					v-model="search"
					type="text"
					class="w-full outline-0 border-0 block text-sm text-gray-900 pl-3 uppercase"
					placeholder="Tìm theo biển số xe VN"
					@keyup.exact.enter="handleSearch(true)"
				/>
				<button v-if="search" class="cursor-pointer mr-3" @click="clearSearchData">
					<img src="@/assets/icons/close-red.svg" class="w-[24px] min-w-[24px]" />
				</button>
				<UButton
					as="button"
					@click="handleSearch(true)"
					:loading="loadingSearch"
					class="hidden lg:flex cursor-pointer text-green-700 items-center justify-center min-w-[80px] gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap"
					type="submit"
					trailing
					variant="ghost"
				>
					<span>Tìm kiếm </span>
				</UButton>
			</div>

			<div class="flex items-center gap-1 rounded-lg border border-[#2E7D32] bg-primary-gradient">
				<UDrawer
					v-model:open="isOpenAdvancedFilter"
					direction="right"
					:ui="{ overlay: 'bg-gray-800/25' }"
					:dismissible="false"
					:handle="false"
				>
					<UButton
						as="button"
						:loading="loadingSearch"
						class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[100px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
						type="submit"
						trailing
						variant="ghost"
					>
						<img src="@/assets/icons/filters-white.svg" />
						<span>{{ advancedFilterCount > 0 ? `Bộ lọc (${advancedFilterCount})` : 'Bộ lọc' }}</span>
					</UButton>
					<template #content>
						<div class="min-w-96 min-h-96 h-screen size-full p-4 bg-white flex flex-col">
							<div class="mb-3 py-2 border-b border-gray-200 relative">
								<p class="text-lg font-semibold w-full text-center">Bộ lọc</p>
								<button class="absolute z-4 top-2 right-2 cursor-pointer" @click="isOpenAdvancedFilter = false">
									<img src="@/assets/icons/close-red.svg" />
								</button>
							</div>
							<div class="flex flex-col gap-3">
								<div class="">
									<p class="text-sm mb-2 text-black">Loại dịch vụ</p>
									<USelect
										v-model="service_ids"
										multiple
										value-key="id"
										size="xl"
										:variant="'none'"
										:items="listServices"
										arrow
										placeholder="Tất cả"
										class="w-full rounded border border-gray-300 text-sm py-2 h-[44px]"
										:ui="{
											content: 'min-w-fit overflow-y-scroll',
											base: 'cursor-pointer hover:bg-gray-200/50',
											item: 'cursor-pointer hover:bg-gray-200/50',
										}"
									/>
								</div>
								<div v-if="tabNo === 20" class="">
									<p class="text-sm mb-2 text-black">Trạng thái xe VN</p>
									<USelect
										v-model="vehicle_status"
										value-key="id"
										size="xl"
										:variant="'none'"
										:items="listStatuses"
										arrow
										placeholder="Tất cả"
										class="w-full rounded border border-gray-300 text-sm py-2 h-[44px]"
										:ui="{
											content: 'min-w-fit overflow-y-scroll',
											base: 'cursor-pointer hover:bg-gray-200/50',
											item: 'cursor-pointer hover:bg-gray-200/50',
										}"
									/>
								</div>
								<div class="">
									<p class="text-sm mb-2 text-black">Thời gian vào</p>
									<DateRangePicker v-model="time_in_range" />
								</div>
								<div v-if="tabNo !== 10" class="">
									<p class="text-sm mb-2 text-black">Thời gian ra</p>
									<DateRangePicker v-model="time_out_range" />
								</div>
							</div>
							<div class="mt-auto flex items-center gap-2">
								<UButton
									as="button"
									class="hidden lg:flex cursor-pointer text-black bg-gray-200 items-center justify-center w-full min-w-[150px] gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap"
									type="submit"
									trailing
									color="warning"
									@click="clearFilterData"
								>
									<span>Thiết lập lại </span>
								</UButton>
								<UButton
									as="button"
									class="hidden lg:flex cursor-pointer text-white items-center justify-center w-full min-w-[150px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
									type="submit"
									trailing
									@click="handleSearchByAdvancedFilter"
								>
									<span>Lọc </span>
								</UButton>
							</div>
						</div>
					</template>
				</UDrawer>
			</div>
			<UButton
				as="button"
				:loading="loadingSearch || loadingExport"
				:disabled="loadingSearch || loadingExport"
				class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[100px] gap-2 px-4 py-2 rounded-md bg-primary-gradient text-sm whitespace-nowrap"
				type="submit"
				trailing
				variant="ghost"
				@click="handleExportExcel"
			>
				<img class="h-5" src="@/assets/icons/file-excel-regular-full.svg" />
				<span>Xuất Excel</span>
			</UButton>
		</div>

		<div class="gap-3 my-4 overflow-y-scroll min-h-[250px]" style="max-height: calc(100vh - 500px)">
			<VehicleTable
				v-if="listData"
				:listData="listData"
				:tabNo="tabNo"
				:setSelectedVehicle="setSelectedVehicle"
				:setSelectedVehicleToDelete="setSelectedVehicleToDelete"
				:setSelectedVehicleToRelease="setSelectedVehicleToRelease"
				:setSelectedVehicleToQC="setSelectedVehicleToQC"
				:setSelectedVehicleToEnterXC="setSelectedVehicleToEnterXC"
			/>
			<EmptyParkingEvent v-if="!loadingSearch && (!listData || !listData.length)" />
		</div>
		<div class="w-full flex items-center justify-end">
			<UPagination
				v-model:page="page"
				:disabled="loadingSearch"
				show-edges
				:total="total"
				:items-per-page="size"
				active-variant="subtle"
				:ui="{ item: 'cursor-pointer' }"
			/>
		</div>
		<EditVehicleModal
			:isOpen="isOpenEditModal"
			:vehicle="selectedVehicle"
			@cancel-modal="clearSelectedVehicle"
			@updated="handleUpdatedJob"
		/>
		<DeleteVehicleModal
			:isOpen="isOpenDeleteModal"
			:vehicle="selectedVehicleToDelete"
			@cancel-modal="clearSelectedVehicle"
			@deleted="handleUpdatedJob"
		/>
		<ReleaseVehicleModal
			:isOpen="isOpenReleaseModal"
			:vehicle="selectedVehicleToRelease"
			@cancel-modal="clearSelectedVehicle"
			@updated="handleUpdatedJob"
		/>
		<ConfirmEnterXCVehicleModal
			:isOpen="isOpenEnterXCModal"
			:vehicle="selectedVehicleToEnterXC"
			@cancel-modal="clearSelectedVehicle"
			@updated="handleUpdatedJob"
		/>
		<SetQPVehicleModal
			:isOpen="isOpenSetQCModal"
			:vehicle="selectedVehicleToQC"
			@cancel-modal="clearSelectedVehicle"
			@updated="handleUpdatedJob"
		/>
	</div>
</template>

<script lang="ts" setup>
	import { useCustomToast } from '@/composable/useCustomToast';
	import { useInternalStore } from '@/store/internal';
	import { toDateString, toCalendarRange } from '@/utils/formater';
	import type { root } from 'postcss';
	import VehicleCard from './VehicleCard.vue';
	import EditVehicleModal from './Modal/EditVehicleModal.vue';
	import DeleteVehicleModal from './Modal/DeleteVehicleModal.vue';
	import ReleaseVehicleModal from './Modal/ReleaseVehicleModal.vue';
	import ConfirmEnterXCVehicleModal from './Modal/ConfirmEnterXCVehicleModal.vue';
	import SetQPVehicleModal from './Modal/SetQPVehicleModal.vue';
	import VehicleTable from './Table/VehicleTable.vue';
	import DateRangePicker from './Elements/DateRangePicker.vue';
	import type { Vehicle } from '@/models/Vehicle';
	import type { ApiService } from '@/services/index';
	import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
	import { normalizeDate } from '../utils/formater';
	import type { apiResponse } from '../models/index';

	type vehicleQuery = {
		search?: string;
		vehicle_status?: string;
		service_ids?: string;
		time_in_from?: string;
		time_in_to?: string;
		time_out_from?: string;
		time_out_to?: string;
		page: number;
		size: number;
	};

	const emit = defineEmits(['loading-search']);

	const { successToast, errorToast } = useCustomToast();
	const tz = getLocalTimeZone();
	const current = today(tz);

	const loadingSearch = ref<boolean>(false);
	const loadingExport = ref<boolean>(false);
	const refInterval = ref<number>(0);
	const search = ref<string>('');
	const service = ref('');
	const service_ids = ref<string[]>([]);
	const vehicle_status = ref('');
	const time_in_range = ref<{
		start: CalendarDate | null;
		end: CalendarDate | null;
	}>({
		start: current,
		end: current,
	});
	const time_out_range = ref<{
		start: CalendarDate | null;
		end: CalendarDate | null;
	}>({
		start: null,
		end: null,
	});
	const selectedVehicle = ref<null | Vehicle>(null);
	const selectedVehicleToDelete = ref<null | Vehicle>(null);
	const selectedVehicleToRelease = ref<null | Vehicle>(null);
	const selectedVehicleToQC = ref<null | Vehicle>(null);
	const selectedVehicleToEnterXC = ref<null | Vehicle>(null);
	const isFirstLoad = ref<boolean>(true);
	const isOpenAdvancedFilter = ref<boolean>(false);
	const listData = ref<null | Vehicle[]>(null);
	const total = ref<number>(1);
	const page = ref<number>(1);
	const size = ref<number>(15);
	const hasMore = ref<boolean>(true);
	const scrollContainers = reactive<Record<number, HTMLElement | null>>({});
	const ableToViewClearFilter = computed(() => {
		return Boolean(
			search.value.trim() ||
				service_ids.value.length > 0 ||
				vehicle_status.value ||
				(time_in_range.value.start && time_in_range.value.end) ||
				(time_out_range.value.start && time_out_range.value.end)
		);
	});

	const props = defineProps({
		refSync: { type: Number, required: true },
		tabNo: { type: Number, required: true },
	});

	const time_in_range_parse = computed(() => toDateString(time_in_range.value));
	const time_out_range_parse = computed(() => toDateString(time_out_range.value));
	const advancedFilterCount = computed(() => {
		let count = 0;
		if (service.value) {
			count += 1;
		}
		if (vehicle_status.value) {
			count += 1;
		}
		if (time_in_range.value.start && time_in_range.value.end) {
			count += 1;
		}
		if (time_out_range.value.start && time_out_range.value.end) {
			count += 1;
		}
		return count;
	});

	const internalStore = useInternalStore();

	const listServices = computed(() => [
		{
			id: null,
			label: 'Tất cả',
		},
		...internalStore.$state.listServices,
	]);

	const listStatuses = computed(() => [
		{
			id: null,
			label: 'Tất cả',
		},
		{
			id: '20',
			label: 'Đủ điều kiện',
		},
		{
			id: '21',
			label: 'Đã ra khỏi bãi',
		},
	]);
	const isOpenEditModal = computed(() => Boolean(selectedVehicle.value?.id));
	const isOpenDeleteModal = computed(() => Boolean(selectedVehicleToDelete.value?.id));
	const isOpenReleaseModal = computed(() => Boolean(selectedVehicleToRelease.value?.id));
	const isOpenEnterXCModal = computed(() => Boolean(selectedVehicleToEnterXC.value?.id));
	const isOpenSetQCModal = computed(() => Boolean(selectedVehicleToQC.value?.id));
	const tabTitle = computed(() => {
		switch (props.tabNo) {
			case 10:
				return 'Danh sách xe trong bãi';
			case 20:
				return 'Danh sách xe đủ điều kiện';
			case 30:
				return 'Danh sách xe đã ra';

			default:
				return 'Danh sách xe';
		}
	});

	const config = useNuxtApp();
	const apiService = config.$api as ApiService;

	const clearFilterData = () => {
		if (!ableToViewClearFilter.value) {
			isOpenAdvancedFilter.value = false;
			return;
		}
		search.value = '';
		service.value = '';
		service_ids.value = [];
		time_out_range.value = {
			start: null,
			end: null,
		};
		time_in_range.value = {
			start: null,
			end: null,
		};
		isOpenAdvancedFilter.value = false;
		handleSearch();
	};

	const clearSearchData = () => {
		search.value = '';
		handleSearch();
	};
	const handleSearchByAdvancedFilter = () => {
		handleSearch(true);
		isOpenAdvancedFilter.value = false;
	};
	const handleSearch = (shouldRestartPage: boolean = false) => {
		getListData({}, shouldRestartPage);
		// handleSyncFromLocal();
	};
	const getListData = (query?: Record<string, any>, shouldRestartPage: boolean = false) => {
		loadingSearch.value = true;
		const q = {
			...query,
			search: search.value,
			service_ids: service_ids.value.join(','),
			tab_id: props.tabNo,
			vehicle_status: vehicle_status.value,
			page: page.value,
			size: size.value,
		} as vehicleQuery;
		if (shouldRestartPage) {
			q.page = 1;
		}
		if (time_in_range_parse.value.start && time_in_range_parse.value.end) {
			q.time_in_from = normalizeDate(time_in_range_parse.value.start);
			q.time_in_to = normalizeDate(time_in_range_parse.value.end);
		}
		if (time_out_range_parse.value.start && time_out_range_parse.value.end) {
			q.time_out_from = normalizeDate(time_out_range_parse.value.start);
			q.time_out_to = normalizeDate(time_out_range_parse.value.end);
		}

		const filteredQ = formatFilterByTabNo(q);

		internalStore.setAdvancedFilter({
			tab: props.tabNo,
			...filteredQ,
		});

		apiService.vehicle
			.getListData(filteredQ)
			.then(
				res => {
					const vehicles = res.data.vehicles || [];
					const meta = res.data.meta?.pagination || {};
					total.value = Number(meta.total_pages) * size.value || 15;
					page.value = Number(meta.current_page) || 1;
					listData.value = vehicles;
				},
				err => {
					errorToast({ title: `Lỗi lấy dữ liệu: ${err}` });
				}
			)
			.finally(() => {
				loadingSearch.value = false;
				isFirstLoad.value = false;
			})
			.catch(err => {
				errorToast({ title: `Lỗi xử lý dữ liệu: ${err}` });
			});
	};

	watch(
		() => props.refSync,
		() => {
			if (props.refSync) {
				handleSearch();
			}
		}
	);

	watch(
		() => page.value,
		() => {
			if (page.value) {
				handleSearch();
			}
		}
	);
	watch(
		() => isOpenAdvancedFilter.value,
		() => {
			syncFilterFromStore();
		}
	);
	watch(
		() => loadingSearch.value,
		() => {
			emit('loading-search', loadingSearch.value);
		}
	);

	onMounted(() => {
		syncFilterFromStore();
		handleSearch();

		refInterval.value = setInterval(() => {
			handleSearch();
		}, 300 * 1000) as unknown as number;
	});
	onUnmounted(() => {
		clearInterval(refInterval.value);
	});

	const setSelectedVehicle = (data: Vehicle) => {
		selectedVehicle.value = data;
	};
	const setSelectedVehicleToDelete = (data: Vehicle) => {
		selectedVehicleToDelete.value = data;
	};
	const setSelectedVehicleToRelease = (data: Vehicle) => {
		selectedVehicleToRelease.value = data;
	};
	const setSelectedVehicleToQC = (data: Vehicle) => {
		selectedVehicleToQC.value = data;
	};
	const setSelectedVehicleToEnterXC = (data: Vehicle) => {
		selectedVehicleToEnterXC.value = data;
	};
	const clearSelectedVehicle = () => {
		selectedVehicle.value = null;
		selectedVehicleToDelete.value = null;
		selectedVehicleToRelease.value = null;
		selectedVehicleToQC.value = null;
		selectedVehicleToEnterXC.value = null;
	};

	const syncFilterFromStore = () => {
		const filter = internalStore.$state.advancedFilter.find(f => f.tab === props.tabNo);
		const current = today(tz);
		if (filter) {
			search.value = filter.search || '';
			service_ids.value = filter.service_ids ? filter.service_ids.split(',') : [];
			time_in_range.value = toCalendarRange(filter.time_in_from, filter.time_in_to) || { start: null, end: null };
			time_out_range.value = toCalendarRange(filter.time_out_from, filter.time_out_to) || {
				start: null,
				end: null,
			};
		} else {
			search.value = '';
			service_ids.value = [];
			time_in_range.value = { start: null, end: null };
			time_out_range.value = { start: null, end: null };
		}
	};

	const handleUpdatedJob = () => {
		clearSelectedVehicle();
		handleSearch();
	};

	const formatFilterByTabNo = (filter: vehicleQuery) => {
		const formattedFilter = { ...filter };
		if (props.tabNo === 10) {
			delete formattedFilter.time_out_from;
			delete formattedFilter.time_out_to;
			delete formattedFilter.vehicle_status;
		} else if (props.tabNo === 30) {
			delete formattedFilter.vehicle_status;
		}
		return formattedFilter;
	};
	const handleExportExcel = () => {
		let exportService = null as
			| null
			| ((payload?: Record<string, any>) => Promise<
					apiResponse<{
						url: string;
					}>
			  >);
		const q = {
			search: search.value,
			service_ids: service_ids.value.join(','),
			vehicle_status: vehicle_status.value,
			tab_id: props.tabNo,
			page: page.value,
			size: size.value,
		} as vehicleQuery;
		if (time_in_range_parse.value.start && time_in_range_parse.value.end) {
			q.time_in_from = normalizeDate(time_in_range_parse.value.start);
			q.time_in_to = normalizeDate(time_in_range_parse.value.end);
		}
		if (time_out_range_parse.value.start && time_out_range_parse.value.end) {
			q.time_out_from = normalizeDate(time_out_range_parse.value.start);
			q.time_out_to = normalizeDate(time_out_range_parse.value.end);
		}

		const filteredQ = formatFilterByTabNo(q);
		switch (props.tabNo) {
			case 10:
				exportService = apiService.vehicle.exportXeTrongBai83;
				break;
			case 20:
				exportService = apiService.vehicle.exportXeDuDK;
				break;
			case 30:
				exportService = apiService.vehicle.exportXeDaVaoBai;
				break;
			default:
				break;
		}
		if (!exportService) {
			errorToast({ title: `Lỗi xử lý khi lấy exportService` });
			return;
		}
		loadingExport.value = true;
		exportService(filteredQ)
			.then(
				res => {
					const link = document.createElement('a');
					link.href = res.data.url;
					link.download = `danh_sach_xe_${props.tabNo}_${new Date().toISOString()}.xlsx`;
					link.target = '_blank';
					link.click();
					link.remove();
				},
				err => {
					errorToast({ title: `Lỗi xuất Excel: ${err}` });
				}
			)
			.catch(err => {
				errorToast({ title: `Lỗi xử lý dữ liệu: ${err}` });
			})
			.finally(() => {
				loadingExport.value = false;
			});
	};
</script>
