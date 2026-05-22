<script setup lang="ts">
import type { SystemUser } from '../types/system-management';

import { ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { listSystemUsers } from '../api/system-management-service';

type UserOption = {
  id: string;
  label: string;
  loginName: string;
  name: string;
};

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue: string;
    placeholder?: string;
    selectedLabel?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    placeholder: '请选择人员',
    selectedLabel: '',
  },
);

const emit = defineEmits<{
  change: [user: null | { id: string; name: string }];
  'update:modelValue': [value: string];
}>();

const loading = ref(false);
const options = ref<UserOption[]>([]);

function mapUserOption(user: SystemUser): UserOption {
  return {
    id: user.id,
    label: user.name,
    loginName: user.loginName,
    name: user.name,
  };
}

function ensureSelectedOption() {
  if (!props.modelValue || !props.selectedLabel) {
    return;
  }
  if (options.value.some((option) => option.id === props.modelValue)) {
    return;
  }
  options.value = [
    {
      id: props.modelValue,
      label: props.selectedLabel,
      loginName: '',
      name: props.selectedLabel,
    },
    ...options.value,
  ];
}

async function remoteSearch(keyword: string) {
  loading.value = true;
  try {
    const result = await listSystemUsers({
      enabled: true,
      keyword: keyword.trim() || undefined,
      page: 1,
      size: 20,
    });
    options.value = result.items.map(mapUserOption);
    ensureSelectedOption();
  } finally {
    loading.value = false;
  }
}

function handleChange(value: string) {
  emit('update:modelValue', value);
  const option = options.value.find((item) => item.id === value) ?? null;
  emit(
    'change',
    option
      ? {
          id: option.id,
          name: option.name,
        }
      : null,
  );
}

watch(
  () => [props.modelValue, props.selectedLabel],
  () => {
    ensureSelectedOption();
  },
  { immediate: true },
);
</script>

<template>
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    remote
    reserve-keyword
    :remote-method="remoteSearch"
    @update:model-value="handleChange"
    @visible-change="(visible) => visible && remoteSearch('')"
  >
    <ElOption
      v-for="option in options"
      :key="option.id"
      :label="option.label"
      :value="option.id"
    />
  </ElSelect>
</template>
