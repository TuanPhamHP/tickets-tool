<template>
	<div class="relative">
		<textarea
			ref="textareaRef"
			:value="modelValue"
			:placeholder="placeholder"
			:rows="rows"
			class="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg outline-none resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent leading-relaxed"
			@input="onInput"
			@keydown="onKeydown"
			@blur="onBlur"
		/>

		<!-- Mention dropdown -->
		<div
			v-if="showDropdown && filteredUsers.length > 0"
			class="absolute z-50 left-0 bottom-full mb-1 w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden"
		>
			<div class="py-1 max-h-48 overflow-y-auto">
				<button
					v-for="(u, idx) in filteredUsers"
					:key="u.id"
					type="button"
					:class="[
						'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
						idx === activeIdx ? 'bg-green-50 text-green-800' : 'hover:bg-gray-50 text-gray-700',
					]"
					@mousedown.prevent="selectUser(u)"
				>
					<UAvatar :alt="u.name" size="xs" class="flex-shrink-0" />
					<span class="truncate">{{ u.name }}</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = withDefaults(
		defineProps<{
			modelValue: string;
			placeholder?: string;
			rows?: number;
			users?: Array<{ id: number; name: string; avatar?: string }>;
		}>(),
		{ placeholder: 'Viết bình luận...', rows: 2, users: () => [] },
	);

	const emit = defineEmits<{
		'update:modelValue': [value: string];
		'submit': [];
	}>();

	const textareaRef = ref<HTMLTextAreaElement | null>(null);
	const showDropdown = ref(false);
	const mentionQuery = ref('');
	const activeIdx = ref(0);
	const mentionStart = ref(-1); // cursor position where '@' was typed

	const filteredUsers = computed(() => {
		if (!mentionQuery.value) return props.users.slice(0, 8);
		const q = mentionQuery.value.toLowerCase();
		return props.users.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 8);
	});

	const getMentionAtCursor = (text: string, cursor: number) => {
		// Find '@' before cursor that hasn't been closed
		const before = text.slice(0, cursor);
		const match = before.match(/@([^@\n]*)$/);
		if (!match) return null;
		return { query: match[1], start: before.lastIndexOf('@') };
	};

	const onInput = (e: Event) => {
		const el = e.target as HTMLTextAreaElement;
		emit('update:modelValue', el.value);

		const cursor = el.selectionStart ?? 0;
		const mention = getMentionAtCursor(el.value, cursor);
		if (mention) {
			mentionQuery.value = mention.query;
			mentionStart.value = mention.start;
			activeIdx.value = 0;
			showDropdown.value = true;
		} else {
			showDropdown.value = false;
		}
	};

	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			// Mention dropdown open → select item
			if (showDropdown.value && filteredUsers.value.length > 0) {
				e.preventDefault();
				const user = filteredUsers.value[activeIdx.value];
				if (user) selectUser(user);
				return;
			}
			// Shift+Enter → new line (default behavior)
			if (e.shiftKey) return;
			// Plain Enter → submit
			e.preventDefault();
			emit('submit');
			return;
		}

		if (!showDropdown.value || filteredUsers.value.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx.value = (activeIdx.value + 1) % filteredUsers.value.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx.value = (activeIdx.value - 1 + filteredUsers.value.length) % filteredUsers.value.length;
		} else if (e.key === 'Tab') {
			e.preventDefault();
			selectUser(filteredUsers.value[activeIdx.value]);
		} else if (e.key === 'Escape') {
			showDropdown.value = false;
		}
	};

	const onBlur = () => {
		// Delay to allow mousedown on dropdown items to fire first
		setTimeout(() => {
			showDropdown.value = false;
		}, 150);
	};

	const selectUser = (u: { id: number; name: string }) => {
		const el = textareaRef.value;
		if (!el) return;

		const cursor = el.selectionStart ?? 0;
		const before = el.value.slice(0, mentionStart.value);
		const after = el.value.slice(cursor);
		const mention = `@[${u.name}]`;

		const newValue = before + mention + ' ' + after;
		emit('update:modelValue', newValue);
		showDropdown.value = false;

		nextTick(() => {
			el.focus();
			const newCursor = before.length + mention.length + 1;
			el.setSelectionRange(newCursor, newCursor);
		});
	};
</script>
