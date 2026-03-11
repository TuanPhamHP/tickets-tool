import { addHours, format } from 'date-fns';
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';

export function convertUTCToGMT7(utcDateString: string | number, form?: string): string {
	// Parse string thành Date
	const utcDate = new Date(utcDateString);

	// Thêm 7 tiếng
	const gmt7Date = addHours(utcDate, 7);

	// Format kết quả
	return format(gmt7Date, form || "yyyy-MM-dd'T'HH:mm:ss.SSS'+07:00'");
}

export const formatCurrency = (number: number): string => {
	return new Intl.NumberFormat('vi-VN', {
		minimumFractionDigits: 0, // Số chữ số thập phân tối thiểu
		maximumFractionDigits: 4,
	}).format(number);
};

export function formatGapTime(startTime: number | string | Date, endTime: number | string | Date): string {
	const start = new Date(startTime).getTime();
	const end = new Date(endTime).getTime();

	if (end < start) return 'Thời gian không hợp lệ';

	const gapTime = end - start;

	const seconds = Math.floor(gapTime / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	const remainingHours = hours % 24;
	const remainingMinutes = minutes % 60;
	const dayStr = days ? `${days} ngày` : ``;
	return `${dayStr} ${remainingHours} giờ ${remainingMinutes} phút`;
}
export const isNumb = (str: string | number) => {
	// return /^\d{1,2}$/.test(`${str}`);
	const regex = new RegExp('^\\d+(?:\\.\\d{0,2})?$', 'gm');
	return regex.test(`${str}`);
};
export const isIntNumb = (str: string | number) => {
	// return /^\d{1,2}$/.test(`${str}`);
	const regex = new RegExp('^[0-9]*$', 'gm');
	return regex.test(`${str}`);
};
export const currencyValidNumb = (str: string | number) => {
	return !isNumb(`${str}`.replaceAll(',', '').replaceAll('-', ''));
};
export const currencyValidNumbInt = (str: string | number) => {
	return !isIntNumb(`${str}`.replaceAll(',', '').replaceAll('-', ''));
};

export const getDataErrors = (dataRules: Record<string, string[]>, dataObj: Record<string, any>) => {
	const obj: Record<string, string> = {};
	for (const key in dataRules) {
		if (Object.hasOwnProperty.call(dataRules, key)) {
			if (Array.isArray(dataRules[key])) {
				if (dataRules[key].includes('required')) {
					// @ts-ignore
					if (key && !dataObj[key]) {
						obj[key] = 'Không được để trống trường này.';
					}
				}
				if (dataRules[key].includes('array:required')) {
					// @ts-ignore
					if (Array.isArray(dataObj[key]) && !dataObj[key].length) {
						obj[key] = 'Không được để trống trường này.';
					}
				}
				if (dataRules[key].includes('number')) {
					// @ts-ignore
					const val = String(dataObj[key]);
					if (val && currencyValidNumb(val)) {
						obj[key] = 'Giá trị không đúng định dạng số';
					}
					const isInt = dataRules[key].find(o => o.includes('int'));
					if (isInt) {
						if (val && currencyValidNumbInt(val)) {
							obj[key] = 'Giá trị không đúng định dạng số nguyên';
						}
					}
					const k = dataRules[key].find(o => o.includes('gt:'));
					if (k) {
						const min = +k.replaceAll('gt:', '') as number;
						if (+String(val).replaceAll(',', '') < min) {
							obj[key] = `Giá trị nhập vào phải lớn hơn ${min}`;
						}
					}
				}
				const maxLengthRule = dataRules[key].find(o => o.includes('max:'));
				if (maxLengthRule) {
					const maxLength = +(maxLengthRule.split(':').pop() || 0);
					// @ts-ignore
					if (key && dataObj[key].length > maxLength) {
						obj[key] = `Tối đa ${maxLength} kí tự.`;
					}
				}
			}
		}
	}
	return obj;
};
export const formatDateTime = (dateStr: string) => {
	if (!dateStr) return '-';

	return new Date(dateStr).toLocaleString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
};
export function toDateString(range: { start: any; end: any }) {
	if (!range?.start || !range?.end) return { start: '', end: '' };

	const tz = getLocalTimeZone();
	const df = new DateFormatter('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

	return {
		start: df.format(range.start.toDate(tz)),
		end: df.format(range.end.toDate(tz)),
	};
}

export function toCalendarRange(from: string, to: string) {
	if (!from || !to) return null;
	return {
		start: parseDate(`${from}`),
		end: parseDate(`${to}`),
	};
}

export function normalizeDate(dateStr: string): string {
	if (!dateStr) return '';
	const [day, month, year] = dateStr.split('/');
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function getHistoryLabel(str: string): string {
	const map: Record<string, string> = {
		created: 'Tạo mới',
		updated: 'Cập nhật',
		deleted: 'Xoá',
		approved: 'Phê duyệt',
		rejected: 'Từ chối',
		estimated: 'Ước tính',
		assigned: 'Phân công',
		unassigned: 'Bỏ phân công',
		commented: 'Bình luận',
		completed: 'Hoàn tất',
		submitted: 'Gửi ticket',
		started: 'Bắt đầu',
		cancelled: 'Huỷ',
	};

	if (map[str]) return map[str];

	return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatDescription(text: string): string {
	if (!text) return '';
	return text;
}
