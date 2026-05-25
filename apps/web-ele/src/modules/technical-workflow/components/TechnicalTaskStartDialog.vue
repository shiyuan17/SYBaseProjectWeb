<script setup lang="ts">
import type {
  BatchOperatorRequest,
  PendingTechnicalTaskItem,
  TechnicalOperatorFormValue,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElMessage,
} from 'element-plus';

import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable, formatObjectType } from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = withDefaults(
  defineProps<{
    confirmText: string;
    modelValue: boolean;
    remarksPlaceholder?: string;
    submitAction: (taskId: string, payload: BatchOperatorRequest) => Promise<unknown>;
    successMessage: (task: PendingTechnicalTaskItem) => string;
    task: null | PendingTechnicalTaskItem;
    terminalPlaceholder?: string;
    title: string;
  }>(),
  {
    remarksPlaceholder: '必要时补充说明',
    terminalPlaceholder: '请输入终端编码',
  },
);

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const submitting = ref(false);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
}

async function submitStart() {
  const taskId = props.task?.id?.trim();
  if (!taskId) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }

  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    await props.submitAction(taskId, payload);
    ElMessage.success(props.successMessage(props.task!));
    emit('submitted');
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDialogState();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    :title="title"
    width="720px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="任务号">
          {{ formatNullable(task?.id) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(task?.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(task?.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象编号">
          {{ formatNullable(task?.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          :remarks-placeholder="remarksPlaceholder"
          :terminal-placeholder="terminalPlaceholder"
        />
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitStart">
        {{ confirmText }}
      </ElButton>
    </template>
  </ElDialog>
</template>
