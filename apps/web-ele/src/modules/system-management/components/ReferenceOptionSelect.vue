<script setup lang="ts">
import type { WorkflowReferenceOption } from '../types/workflow-reference';

import { computed, ref, watch } from 'vue';

import { ElAutocomplete } from 'element-plus';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: null | string;
    options: WorkflowReferenceOption[];
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: null,
    placeholder: '请选择或输入内容',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputValue = ref('');

const normalizedOptions = computed(() =>
  props.options.map((option) => ({
    label: option.label.trim(),
    value: option.value.trim(),
  })),
);

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function findMatchedOption(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }
  return (
    normalizedOptions.value.find(
      (option) => option.value === normalizedValue,
    ) ??
    normalizedOptions.value.find(
      (option) => option.label === normalizedValue,
    ) ??
    null
  );
}

function syncInputValueWithModelValue() {
  const currentValue = props.modelValue ?? '';
  const matchedOption = findMatchedOption(currentValue);
  inputValue.value = matchedOption?.label ?? currentValue;
}

function querySearch(
  keyword: string,
  callback: (items: WorkflowReferenceOption[]) => void,
) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    callback(normalizedOptions.value);
    return;
  }

  callback(
    normalizedOptions.value.filter((option) => {
      const labelKeyword = normalizeKeyword(option.label);
      const valueKeyword = normalizeKeyword(option.value);
      return (
        labelKeyword.includes(normalizedKeyword) ||
        valueKeyword.includes(normalizedKeyword)
      );
    }),
  );
}

function emitValue(value: string) {
  emit('update:modelValue', value);
}

function handleInput(value: number | string) {
  const normalizedValue = String(value);
  inputValue.value = normalizedValue;
  emitValue(normalizedValue);
}

function handleSelect(option: Record<string, any>) {
  const normalizedOption = option as WorkflowReferenceOption;
  inputValue.value = normalizedOption.label;
  emitValue(normalizedOption.value);
}

function handleBlur(event: FocusEvent) {
  const rawValue =
    event.target instanceof HTMLInputElement
      ? event.target.value
      : inputValue.value;
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    inputValue.value = '';
    emitValue('');
    return;
  }

  const matchedOption = findMatchedOption(trimmedValue);
  if (matchedOption) {
    inputValue.value = matchedOption.label;
    emitValue(matchedOption.value);
    return;
  }

  inputValue.value = trimmedValue;
  emitValue(trimmedValue);
}

watch(
  () => [props.modelValue, props.options],
  () => {
    syncInputValueWithModelValue();
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <ElAutocomplete
    :clearable="clearable"
    :disabled="disabled"
    :fetch-suggestions="querySearch"
    :model-value="inputValue"
    :placeholder="placeholder"
    :trigger-on-focus="true"
    class="w-full"
    value-key="label"
    @blur="handleBlur"
    @select="handleSelect"
    @update:model-value="handleInput"
  >
    <template #default="{ item }">
      <div class="flex flex-col">
        <span>{{ item.label }}</span>
        <span
          v-if="item.label !== item.value"
          class="text-xs text-muted-foreground"
        >
          {{ item.value }}
        </span>
      </div>
    </template>
  </ElAutocomplete>
</template>
