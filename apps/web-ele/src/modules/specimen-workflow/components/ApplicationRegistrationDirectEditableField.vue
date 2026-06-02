<script setup lang="ts">
import type { WorkbenchInfoItem } from '../utils/application-registration-patient-panel';

import { computed } from 'vue';

import { ElInput, ElOption, ElSelect } from 'element-plus';

const props = defineProps<{
  item: WorkbenchInfoItem;
  valueClass?: string;
}>();

const emit = defineEmits<{
  (event: 'update', item: WorkbenchInfoItem, value: string): void;
}>();

const modelValue = computed({
  get: () => {
    if (props.item.editorType === 'select') {
      return (
        props.item.options?.find((option) => option.label === props.item.value)
          ?.value ?? ''
      );
    }
    return props.item.value === '-' ? '' : props.item.value;
  },
  set: (value: string) => emit('update', props.item, value),
});
</script>

<template>
  <div
    v-if="item.editorType === 'readonly'"
    class="break-words text-[11px] font-medium leading-4 text-foreground"
    :class="valueClass"
  >
    {{ item.value }}
  </div>

  <ElInput
    v-else-if="item.editorType === 'text'"
    v-model="modelValue"
    clearable
    :data-testid="`patient-direct-input-${item.key}`"
    size="small"
  />

  <ElInput
    v-else-if="item.editorType === 'textarea'"
    v-model="modelValue"
    clearable
    :autosize="{
      minRows: item.rows ?? 2,
      maxRows: item.rows ?? 4,
    }"
    :data-testid="`patient-direct-input-${item.key}`"
    resize="none"
    size="small"
    type="textarea"
  />

  <ElSelect
    v-else
    v-model="modelValue"
    :data-testid="`patient-direct-input-${item.key}`"
    size="small"
  >
    <ElOption
      v-for="option in item.options ?? []"
      :key="`${item.key}-${String(option.value)}`"
      :label="option.label"
      :value="option.value"
    />
  </ElSelect>
</template>
