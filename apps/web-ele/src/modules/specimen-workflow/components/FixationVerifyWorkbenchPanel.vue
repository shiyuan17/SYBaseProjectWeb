<script setup lang="ts">
import type { SpecimenRemovalSummary } from '../types/specimen-workflow';

import { ref } from 'vue';

import { ElInput } from 'element-plus';

type QuickInputRef = InstanceType<typeof ElInput> & {
  input?: HTMLInputElement | null;
};

defineProps<{
  quickActionLoading: {
    specimenId: boolean;
  };
  summary: SpecimenRemovalSummary;
}>();

const emit = defineEmits<{
  (event: 'quickConfirm'): void;
}>();

const specimenIdQuickInput = defineModel<string>('specimenIdQuickInput', {
  required: true,
});

const specimenIdQuickInputContainerRef = ref<HTMLDivElement | null>(null);
const specimenIdQuickInputRef = ref<null | QuickInputRef>(null);

function focusQuickInput() {
  const inputRef = specimenIdQuickInputRef.value;
  const containerRef = specimenIdQuickInputContainerRef.value;
  const nativeInput = containerRef?.querySelector('input');
  nativeInput?.focus();
  if (nativeInput !== document.activeElement) {
    inputRef?.input?.focus();
  }
  if (
    nativeInput !== document.activeElement &&
    inputRef?.input !== document.activeElement
  ) {
    inputRef?.focus();
  }
}

defineExpose({
  focusQuickInput,
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-4 text-sm">
    <div>
      全部
      <span class="text-xl font-semibold text-primary">{{
        summary.totalCount
      }}</span>
    </div>
    <div>
      已离体
      <span class="text-xl font-semibold text-success">{{
        summary.confirmedCount
      }}</span>
    </div>
    <div>
      未设置
      <span class="text-xl font-semibold text-danger">{{
        summary.pendingCount
      }}</span>
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div
      ref="specimenIdQuickInputContainerRef"
      v-loading="quickActionLoading.specimenId"
      class="w-[320px]"
    >
      <ElInput
        ref="specimenIdQuickInputRef"
        v-model="specimenIdQuickInput"
        clearable
        placeholder="请输入标本条码/编号后按回车确认"
        @keyup.enter="emit('quickConfirm')"
      />
    </div>
    <slot name="actions"></slot>
  </div>
</template>
