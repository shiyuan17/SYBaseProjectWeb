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
  emit('update:editingValue', (event.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <article
    class="group/item relative rounded-2xl border border-border px-4 transition-colors"
    :class="[
      props.isEditing ? 'py-3' : 'py-2.5',
      props.canEdit && !props.isEditing ? 'hover:border-sky-300' : '',
    ]"
  >
    <button
      v-if="props.canEdit && !props.isEditing"
      aria-label="编辑"
      class="absolute top-1/2 right-3 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-sky-300 hover:text-sky-600 group-hover/item:opacity-100"
      :data-testid="`detail-section-edit-${props.valueTestId}`"
      title="编辑"
      type="button"
      @click.stop="emit('edit')"
    >
      <UserRoundPen aria-hidden="true" class="h-3 w-3" />
    </button>

    <div
      v-if="props.isEditing"
      :data-editor-key="props.valueTestId"
      class="mt-2.5"
    >
      <h3 class="pr-8 text-sm font-semibold text-foreground">
        {{ props.title }}
      </h3>
      <textarea
        :value="props.editingValue"
        class="min-h-[96px] w-full rounded-xl border border-border px-3 py-2.5 text-sm leading-5.5 text-foreground outline-none transition focus:border-sky-400"
        :data-testid="`detail-section-input-${props.valueTestId}`"
        :disabled="props.saving"
        @input="handleInput"
        @keydown.ctrl.enter.prevent="emit('save')"
        @keyup.esc="emit('cancel')"
      ></textarea>
      <div class="mt-2.5 flex items-center justify-end gap-2">
        <button
          class="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="props.saving"
          type="button"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white transition hover:bg-primary/100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="props.saving"
          :data-testid="`detail-section-save-${props.valueTestId}`"
          type="button"
          @click="emit('save')"
        >
          {{ props.saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div
      v-else
      class="flex min-w-0 items-center gap-3 pr-7"
      :class="props.canEdit ? 'cursor-text' : ''"
      @dblclick="props.canEdit ? emit('activate') : undefined"
    >
      <h3 class="shrink-0 text-sm font-semibold text-foreground">
        {{ props.title }}
      </h3>
      <p
        :data-testid="`detail-section-value-${props.valueTestId}`"
        :title="props.value"
        class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-muted-foreground"
      >
        {{ props.value }}
      </p>
    </div>
  </article>
</template>
