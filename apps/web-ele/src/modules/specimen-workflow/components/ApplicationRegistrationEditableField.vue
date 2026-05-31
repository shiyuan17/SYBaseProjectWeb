<script setup lang="ts">
import type { WorkbenchInfoItem } from '../utils/application-registration-patient-panel';

import { computed } from 'vue';

import { Check, UserRoundPen, X } from '@vben/icons';

import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus';

const props = withDefaults(
  defineProps<{
    editingValue: string;
    isEditing: boolean;
    item: WorkbenchInfoItem;
    valueClass?: string;
  }>(),
  {
    valueClass: '',
  },
);

const emit = defineEmits<{
  (event: 'activate', item: WorkbenchInfoItem): void;
  (event: 'beginEdit', item: WorkbenchInfoItem): void;
  (event: 'cancel'): void;
  (event: 'save', item: WorkbenchInfoItem): void;
  (event: 'update:editingValue', value: string): void;
}>();

const modelValue = computed({
  get: () => props.editingValue,
  set: (value: string) => emit('update:editingValue', value),
});

const displayValueClasses = computed(() => [
  props.item.editorType === 'readonly' ? 'pr-0' : 'cursor-text pr-5',
  props.valueClass,
]);

function handleActivate() {
  if (props.item.editorType === 'readonly') {
    return;
  }
  emit('activate', props.item);
}

function handleBeginEdit() {
  emit('beginEdit', props.item);
}

function handleSave() {
  emit('save', props.item);
}
</script>

<template>
  <div class="group/item relative min-h-4">
    <button
      v-if="item.editorType !== 'readonly' && !isEditing"
      aria-label="编辑"
      :data-testid="`patient-edit-${item.key}`"
      class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border/70 bg-background/95 text-[10px] text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-primary/50 hover:text-primary group-hover/item:opacity-100"
      title="编辑"
      type="button"
      @click.stop="handleBeginEdit"
    >
      <UserRoundPen aria-hidden="true" class="h-3 w-3" />
    </button>

    <template v-if="isEditing">
      <div :data-editor-key="item.key" class="patient-inline-editor">
        <div class="min-w-0 flex-1">
          <ElInput
            v-if="item.editorType === 'text'"
            v-model="modelValue"
            clearable
            :data-testid="`patient-input-${item.key}`"
            size="small"
            @keyup.enter="handleSave"
            @keyup.esc="emit('cancel')"
          />

          <ElInput
            v-else-if="item.editorType === 'textarea'"
            v-model="modelValue"
            clearable
            :autosize="{
              minRows: item.rows ?? 2,
              maxRows: item.rows ?? 4,
            }"
            :data-testid="`patient-input-${item.key}`"
            resize="none"
            size="small"
            type="textarea"
            @keydown.ctrl.enter.prevent="handleSave"
            @keyup.esc="emit('cancel')"
          />

          <ElSelect
            v-else
            v-model="modelValue"
            :data-testid="`patient-input-${item.key}`"
            size="small"
          >
            <ElOption
              v-for="option in item.options ?? []"
              :key="`${item.key}-${String(option.value)}`"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </div>

        <div class="patient-inline-editor__actions">
          <ElButton
            aria-label="保存"
            :data-testid="`patient-save-${item.key}`"
            :icon="Check"
            class="patient-inline-editor__button"
            circle
            plain
            size="small"
            title="保存"
            type="primary"
            @click="handleSave"
          />
          <ElButton
            aria-label="取消"
            :data-testid="`patient-cancel-${item.key}`"
            :icon="X"
            class="patient-inline-editor__button"
            circle
            plain
            size="small"
            title="取消"
            @click="emit('cancel')"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      :data-testid="`patient-value-${item.key}`"
      class="break-words text-[11px] font-medium leading-4 text-foreground"
      :class="displayValueClasses"
      @dblclick="handleActivate"
    >
      {{ item.value }}
    </div>
  </div>
</template>

<style scoped>
.patient-inline-editor {
  display: flex;
  gap: 6px;
  align-items: center;
}

.patient-inline-editor__actions {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

:deep(.patient-inline-editor__button.el-button) {
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  margin-left: 0;
}

:deep(.patient-inline-editor__button .el-icon) {
  width: 13px;
  height: 13px;
  font-size: 13px;
}
</style>
