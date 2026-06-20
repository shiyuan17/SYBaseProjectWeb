<script setup lang="ts">
import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
} from '../utils/specimen-receipt';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

const props = defineProps<{
  items: ReceiptDraftItem[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (
    event: 'directReceiveUserChange',
    user: null | { id: string; name: string },
  ): void;
  (event: 'removeRow', key: number): void;
  (event: 'submit'): void;
  (event: 'reReceive'): void;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const form = defineModel<ReceiptOperatorForm>('form', {
  required: true,
});

// 预设拒收原因
const defaultRejectReasons = [
  '标本信息不符',
  '标本容器破损',
  '标本量不足',
  '标本凝固',
  '标本污染',
  '条码模糊',
  '超时送达',
];

// 自定义拒收原因输入
const customReasonInput = ref('');

// 合并后的拒收原因选项
const rejectReasonOptions = computed(() => [
  ...defaultRejectReasons,
  ...form.value.customRejectReasons,
]);

// 判断是否包含已拒收的标本
const hasRejectedItems = computed(() => {
  return props.items.some((item) => item.receiptStatus === 'REJECTED');
});

// 初始化默认选中第一个拒收原因
watch(
  visible,
  (newVisible) => {
    const firstRejectReason = rejectReasonOptions.value[0];
    if (newVisible && !form.value.rejectReason && firstRejectReason) {
      form.value.rejectReason = firstRejectReason;
    }
  },
  { immediate: true },
);

// 添加自定义拒收原因
const addCustomReason = () => {
  const reason = customReasonInput.value.trim();
  if (!reason) {
    ElMessage.warning('请输入自定义拒收原因');
    return;
  }
  if (rejectReasonOptions.value.includes(reason)) {
    ElMessage.warning('该拒收原因已存在');
    return;
  }
  form.value.customRejectReasons.push(reason);
  form.value.rejectReason = reason;
  customReasonInput.value = '';
  ElMessage.success('已添加自定义拒收原因');
};

// 提交拒收
const submitReject = () => {
  if (!form.value.rejectReason) {
    ElMessage.warning('请选择拒收原因');
    return;
  }
  if (!form.value.rectificationSuggestion.trim()) {
    ElMessage.warning('请填写整改建议');
    return;
  }
  emit('submit');
};

// 提交重新接收
const submitReReceive = () => {
  if (!form.value.rectificationEffect.trim()) {
    ElMessage.warning('请填写整改效果');
    return;
  }
  emit('reReceive');
};
</script>

<template>
  <ElDrawer
    v-model="visible"
    :append-to-body="true"
    :destroy-on-close="true"
    direction="btt"
    size="56%"
    title="拒收"
  >
    <div class="flex h-full flex-col gap-6 px-6 py-4">
      <ElForm label-width="120px" class="flex-1">
        <ElFormItem label="自定义拒收原因">
          <div class="flex gap-2">
            <ElInput
              v-model="customReasonInput"
              placeholder="请输入自定义拒收原因"
              class="flex-1"
            />
            <ElButton type="primary" @click="addCustomReason"> 添加 </ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="拒收原因" required>
          <ElSelect
            v-model="form.rejectReason"
            placeholder="请选择拒收原因"
            class="w-full"
          >
            <ElOption
              v-for="reason in rejectReasonOptions"
              :key="reason"
              :label="reason"
              :value="reason"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="整改建议" required>
          <ElInput
            v-model="form.rectificationSuggestion"
            type="textarea"
            :rows="4"
            placeholder="请填写整改建议"
          />
        </ElFormItem>

        <ElFormItem v-if="hasRejectedItems" label="整改效果" required>
          <ElInput
            v-model="form.rectificationEffect"
            type="textarea"
            :rows="4"
            placeholder="请填写整改效果"
          />
        </ElFormItem>
      </ElForm>

      <div class="flex justify-center gap-4 border-t border-border pt-4">
        <ElButton
          :loading="submitting"
          type="warning"
          size="large"
          @click="submitReject"
        >
          拒收
        </ElButton>
        <ElButton
          v-if="hasRejectedItems"
          :loading="submitting"
          type="primary"
          size="large"
          @click="submitReReceive"
        >
          重新接收
        </ElButton>
        <ElButton size="large" @click="emit('close')"> 关闭 </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>
