<script setup lang="ts">
import type {
  ReworkOrderResult,
  TechnicalOperatorFormValue,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { executeReworkOrder } from '../api/technical-workflow-service';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = withDefaults(
  defineProps<{
    initialReworkOrderId?: string;
    modelValue: boolean;
    trackingResult: null | TechnicalTrackingViewModel;
  }>(),
  {
    initialReworkOrderId: '',
  },
);

const emit = defineEmits<{
  submitted: [result: ReworkOrderResult];
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

const executeForm = reactive({
  reworkOrderId: '',
});

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  executeForm.reworkOrderId = props.initialReworkOrderId;
}

async function submitExecuteRework() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!executeForm.reworkOrderId.trim()) {
    ElMessage.warning('请先选择返工单');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await executeReworkOrder(
      executeForm.reworkOrderId.trim(),
      payload,
    );
    ElMessage.success('返工单执行成功');
    emit('submitted', result);
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [props.modelValue, props.initialReworkOrderId],
  ([visible]) => {
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
    title="执行返工单"
    width="820px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          remarks-placeholder="必要时补充返工执行说明"
          terminal-placeholder="返工工作站终端编码"
        />
        <ElFormItem label="返工单" required>
          <ElSelect
            v-model="executeForm.reworkOrderId"
            clearable
            filterable
            placeholder="请选择返工单"
            style="width: 100%"
          >
            <ElOption
              v-for="rework in trackingResult?.reworks ?? []"
              :key="rework.reworkOrderId"
              :label="`${rework.reworkOrderId} / ${rework.reworkType || '未命名类型'} / ${rework.status || '未知状态'}`"
              :value="rework.reworkOrderId"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        :loading="submitting"
        type="success"
        @click="submitExecuteRework"
      >
        执行返工单
      </ElButton>
    </template>
  </ElDialog>
</template>
