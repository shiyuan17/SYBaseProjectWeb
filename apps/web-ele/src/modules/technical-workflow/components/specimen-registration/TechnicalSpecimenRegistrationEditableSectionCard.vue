<script setup lang="ts">
import { UserRoundPen } from '@vben/icons';

const props = defineProps<{
  canEdit?: boolean;
  editingValue: string;
  isEditing: boolean;
  saving?: boolean;
  title: string;
  value: string;
  valueTestId: string;
}>();

const emit = defineEmits<{
  activate: [];
  cancel: [];
  edit: [];
  save: [];
  'update:editingValue': [value: string];
}>();

function handleInput(event: Event) {
  emit(
    'update:editingValue',
    (event.target as HTMLTextAreaElement).value,
  );
}
</script>

<template>
  <article
    class="group/item relative rounded-2xl border border-slate-200 p-4 transition-colors"
    :class="props.canEdit && !props.isEditing ? 'hover:border-sky-300' : ''"
  >
    <button
      v-if="props.canEdit && !props.isEditing"
      aria-label="编辑"
      class="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 opacity-0 shadow-sm transition-all duration-150 hover:border-sky-300 hover:text-sky-600 group-hover/item:opacity-100"
      :data-testid="`detail-section-edit-${props.valueTestId}`"
      title="编辑"
      type="button"
      @click.stop="emit('edit')"
    >
      <UserRoundPen aria-hidden="true" class="h-3.5 w-3.5" />
    </button>

    <h3 class="pr-8 text-sm font-semibold text-slate-900">{{ props.title }}</h3>

    <div v-if="props.isEditing" :data-editor-key="props.valueTestId" class="mt-3">
      <textarea
        :value="props.editingValue"
        class="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-400"
        :data-testid="`detail-section-input-${props.valueTestId}`"
        :disabled="props.saving"
        @input="handleInput"
        @keydown.ctrl.enter.prevent="emit('save')"
        @keyup.esc="emit('cancel')"
      />
      <div class="mt-3 flex items-center justify-end gap-2">
        <button
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="props.saving"
          type="button"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="props.saving"
          :data-testid="`detail-section-save-${props.valueTestId}`"
          type="button"
          @click="emit('save')"
        >
          {{ props.saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <p
      v-else
      :data-testid="`detail-section-value-${props.valueTestId}`"
      class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600"
      :class="props.canEdit ? 'cursor-text' : ''"
      @dblclick="props.canEdit ? emit('activate') : undefined"
    >
      {{ props.value }}
    </p>
  </article>
</template>
