<template>
	<div class="html-editor border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
		<!-- Toolbar -->
		<div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
			<template v-for="(item, i) in toolbar" :key="i">
				<div v-if="item === '|'" class="w-px h-4 bg-gray-300 mx-1" />
				<button
					v-else
					type="button"
					:title="(item as ToolbarItem).label"
					class="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
					@mousedown.prevent="execCmd((item as ToolbarItem).cmd, (item as ToolbarItem).value)"
				>
					<UIcon :name="(item as ToolbarItem).icon" class="w-4 h-4" />
				</button>
			</template>
		</div>

		<!-- Editable area -->
		<div
			ref="editorRef"
			contenteditable="true"
			:data-placeholder="placeholder"
			class="editor-body min-h-[120px] px-3 py-2.5 text-sm text-gray-800 bg-white outline-none leading-relaxed"
			:style="`min-height: ${rows * 1.75}rem`"
			@input="onInput"
			@paste="onPaste"
		/>
	</div>
</template>

<script setup lang="ts">
	type ToolbarItem = { label: string; icon: string; cmd: string; value?: string };
	type ToolbarEntry = ToolbarItem | '|';

	const props = withDefaults(
		defineProps<{
			modelValue: string;
			placeholder?: string;
			rows?: number;
		}>(),
		{
			placeholder: 'Nhập nội dung...',
			rows: 6,
		},
	);

	const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

	const editorRef = ref<HTMLDivElement | null>(null);

	const toolbar: ToolbarEntry[] = [
		{ label: 'In đậm', icon: 'i-heroicons-bold', cmd: 'bold' },
		{ label: 'In nghiêng', icon: 'i-heroicons-italic', cmd: 'italic' },
		{ label: 'Gạch chân', icon: 'i-heroicons-underline', cmd: 'underline' },
		{ label: 'Gạch ngang', icon: 'i-heroicons-strikethrough', cmd: 'strikeThrough' },
		'|',
		{ label: 'Tiêu đề 1', icon: 'i-heroicons-h1', cmd: 'formatBlock', value: 'h2' },
		{ label: 'Tiêu đề 2', icon: 'i-heroicons-h2', cmd: 'formatBlock', value: 'h3' },
		'|',
		{ label: 'Danh sách', icon: 'i-heroicons-list-bullet', cmd: 'insertUnorderedList' },
		{ label: 'Danh sách số', icon: 'i-heroicons-numbered-list', cmd: 'insertOrderedList' },
		'|',
		{ label: 'Căn trái', icon: 'i-heroicons-bars-3-bottom-left', cmd: 'justifyLeft' },
		{ label: 'Căn giữa', icon: 'i-heroicons-bars-3', cmd: 'justifyCenter' },
		'|',
		{ label: 'Xoá định dạng', icon: 'i-heroicons-x-mark', cmd: 'removeFormat' },
	];

	const execCmd = (cmd: string, value?: string) => {
		document.execCommand(cmd, false, value);
		editorRef.value?.focus();
		onInput();
	};

	const onInput = () => {
		emit('update:modelValue', editorRef.value?.innerHTML ?? '');
	};

	const onPaste = (e: ClipboardEvent) => {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain') ?? '';
		document.execCommand('insertText', false, text);
	};

	// Sync modelValue → DOM only on mount or external change
	watch(
		() => props.modelValue,
		(val) => {
			if (editorRef.value && editorRef.value.innerHTML !== val) {
				editorRef.value.innerHTML = val;
			}
		},
	);

	onMounted(() => {
		if (editorRef.value) {
			editorRef.value.innerHTML = props.modelValue ?? '';
		}
	});
</script>

<style scoped>
	.editor-body:empty::before {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
	}

	.editor-body :deep(h2) {
		font-size: 1.15rem;
		font-weight: 600;
		margin: 0.5rem 0 0.25rem;
	}
	.editor-body :deep(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.5rem 0 0.25rem;
	}
	.editor-body :deep(ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.editor-body :deep(ol) {
		list-style: decimal;
		padding-left: 1.25rem;
	}
	.editor-body :deep(b),
	.editor-body :deep(strong) {
		font-weight: 700;
	}
	.editor-body :deep(a) {
		color: #2e7d32;
		text-decoration: underline;
	}
</style>
