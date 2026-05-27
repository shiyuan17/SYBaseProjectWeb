<script setup lang="ts">
import type { BodyPartNode } from '../types/system-management';

import { onMounted, ref, watch } from 'vue';

import { ElAutocomplete } from 'element-plus';

import { listBodyParts } from '../api/system-management-service';

type BodyPartOption = {
  label: string;
  keywords: string[];
  value: string;
};

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue: string;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    placeholder: '请选择或输入部位',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const options = ref<BodyPartOption[]>([]);
const inputValue = ref(props.modelValue);

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function flattenBodyPartOptions(nodes: BodyPartNode[], path: string[] = []) {
  const nextOptions: BodyPartOption[] = [];

  nodes.forEach((node) => {
    const nextPath = [...path, node.partName];
    nextOptions.push({
      label: nextPath.join(' / '),
      keywords: [node.partName, node.partAlias ?? '', nextPath.join(' / ')].filter(Boolean),
      value: node.partName,
    });
    if (node.children?.length) {
      nextOptions.push(...flattenBodyPartOptions(node.children, nextPath));
    }
  });

  return nextOptions;
}

async function loadBodyPartOptions() {
  const nodes = await listBodyParts();
  options.value = flattenBodyPartOptions(nodes);
}

function querySearch(keyword: string, callback: (items: BodyPartOption[]) => void) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    callback(options.value);
    return;
  }

  callback(
    options.value.filter((option) =>
      option.keywords.some((item) => normalizeKeyword(item).includes(normalizedKeyword)),
    ),
  );
}

function emitValue(value: string) {
  emit('update:modelValue', value);
}

function normalizeInputValue(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }
  const matchedOption = options.value.find(
    (option) => option.label === trimmedValue || option.value === trimmedValue,
  );
  return matchedOption?.value ?? trimmedValue;
}

function handleInput(value: number | string) {
  const normalizedValue = String(value);
  inputValue.value = normalizedValue;
  emitValue(normalizedValue);
}

function handleSelect(option: Record<string, any>) {
  const normalizedOption = option as BodyPartOption;
  inputValue.value = normalizedOption.value;
  emitValue(normalizedOption.value);
}

function handleBlur(event: FocusEvent) {
  const nextValue =
    event.target instanceof HTMLInputElement
      ? normalizeInputValue(event.target.value)
      : normalizeInputValue(inputValue.value);
  inputValue.value = nextValue;
  emitValue(nextValue);
}

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = value;
  },
);

onMounted(loadBodyPartOptions);
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
    value-key="value"
    @blur="handleBlur"
    @select="handleSelect"
    @update:model-value="handleInput"
  >
    <template #default="{ item }">
      <div class="flex flex-col">
        <span>{{ item.value }}</span>
        <span v-if="item.label !== item.value" class="text-xs text-muted-foreground">
          {{ item.label }}
        </span>
      </div>
    </template>
  </ElAutocomplete>
</template>
