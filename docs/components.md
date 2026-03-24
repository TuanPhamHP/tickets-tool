# Components

## Tổ chức

```
components/
├── TicketCard.vue       # Feature-specific components (không prefix)
├── MarkdownEditor.vue
├── NotificationPanel.vue
└── ...
```

> Nuxt 4 auto-import components — không cần import thủ công trong `<script setup>`. Component đặt trong subfolder sẽ có prefix: `components/ui/Button.vue` → `<UiButton />`

## Convention

- Một component = một file
- Không đặt business logic (API calls) trực tiếp trong component — tách ra composable
- Component nhận data qua props, emit events lên parent — không tự gọi store trừ khi thực sự cần

## Composables

```
composable/
├── useCustomToast.ts    # Wrapper cho useToast() của @nuxt/ui
└── ...
```

Pattern chuẩn:

```ts
// composable/useTicketActions.ts
export function useTicketActions() {
	const { $api } = useNuxtApp();
	const { successToast, errorToast } = useCustomToast();
	const loading = ref(false);

	async function submitTicket(id: number) {
		loading.value = true;
		try {
			await $api.ticket.submit(id);
			successToast({ title: 'Nộp yêu cầu thành công' });
		} catch (e: unknown) {
			errorToast({ title: 'Lỗi', description: (e as any)?.data?.message || 'Đã có lỗi xảy ra' });
		} finally {
			loading.value = false;
		}
	}

	return { loading, submitTicket };
}
```

## Layouts

| Layout        | Dùng cho                                  |
| ------------- | ----------------------------------------- |
| `default.vue` | Các trang thông thường (có header/footer) |
| `auth.vue`    | Trang login (không có nav)                |

## Khi thêm component mới

1. Đặt trong `components/` (flat hoặc subfolder nếu cần prefix)
2. Dùng `<script setup lang="ts">` + defineProps/defineEmits có type
3. Nếu cần gọi API → tạo composable trong `composable/`, không gọi service trực tiếp trong component

## Pitfalls

1. Component phức tạp (> ~150 dòng) → tách logic vào composable
