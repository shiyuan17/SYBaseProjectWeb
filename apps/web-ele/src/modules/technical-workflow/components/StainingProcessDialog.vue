<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalOperatorFormValue,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { completeSlideStaining } from '../api/technical-workflow-service';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCaseStatus,
  formatNullable,
  formatObjectType,
} from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = defineProps<{
  modelValue: boolean;
  task: null | PendingTechnicalTaskItem;
}>();

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

const completeForm = reactive({
  qualityIssue: '',
  slideId: '',
  stainingType: 'HE',
  taskId: '',
});

const currentTaskContext = computed(() => ({
  objectId: completeForm.slideId || props.task?.objectId || '',
  objectType: props.task?.objectType ?? '',
  pathologyNo: props.task?.pathologyNo ?? '',
  taskId: completeForm.taskId || props.task?.id || '',
}));

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  completeForm.qualityIssue = '';
  completeForm.slideId =
    props.task?.objectType === 'SLIDE' ? (props.task.objectId ?? '') : '';
  completeForm.stainingType = 'HE';
  completeForm.taskId = props.task?.id ?? '';
}

async function submitStaining() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  if (!completeForm.slideId.trim()) {
    ElMessage.warning('请先确认玻片编号');
    return;
  }
  if (!completeForm.stainingType.trim()) {
    ElMessage.warning('请先填写染色类型');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await completeSlideStaining({
      ...payload,
      qualityIssue: completeForm.qualityIssue.trim() || null,
      slideId: completeForm.slideId.trim(),
      stainingType: completeForm.stainingType.trim(),
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(
      `染色完成，病例状态已更新为 ${formatCaseStatus(result.caseStatus)}`,
    );
    emit('submitted');
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
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
    title="染色处理"
    width="820px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="任务号">
          {{ formatNullable(currentTaskContext.taskId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(currentTaskContext.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(currentTaskContext.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="玻片编号">
          {{ formatNullable(currentTaskContext.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          terminal-placeholder="染色终端编码"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="玻片编号" required>
            <ElInput
              v-model="completeForm.slideId"
              placeholder="由当前任务带入"
              readonly
            />
          </ElFormItem>
          <ElFormItem label="染色类型" required>
            <ElInput
              v-model="completeForm.stainingType"
              placeholder="例如：HE、IHC"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="质量问题">
          <ElInput
            v-model="completeForm.qualityIssue"
            :rows="3"
            placeholder="必要时记录染色质量问题"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitStaining">
        完成染色
      </ElButton>
    </template>
  </ElDialog>
</template>
