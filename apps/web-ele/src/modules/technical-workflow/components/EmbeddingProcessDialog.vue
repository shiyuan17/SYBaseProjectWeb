<script setup lang="ts">
import type {
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
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { completeEmbedding } from '../api/technical-workflow-service';
import { EVALUATION_LEVEL_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable, formatObjectType } from '../utils/format';
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
  blockCount: 1,
  deviceCode: '',
  embeddingBoxNo: '',
  evaluationLevel: '',
  samplingBlockId: '',
  samplingEvaluation: '',
  sliceNotice: '',
  taskId: '',
});

const currentTaskContext = computed(() => ({
  objectId: completeForm.samplingBlockId || props.task?.objectId || '',
  objectType: props.task?.objectType ?? '',
  pathologyNo: props.task?.pathologyNo ?? '',
  taskId: completeForm.taskId || props.task?.id || '',
}));

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  completeForm.blockCount = 1;
  completeForm.deviceCode = '';
  completeForm.embeddingBoxNo = '';
  completeForm.evaluationLevel = '';
  completeForm.samplingBlockId =
    props.task?.objectType === 'SAMPLING_BLOCK'
      ? (props.task.objectId ?? '')
      : '';
  completeForm.samplingEvaluation = '';
  completeForm.sliceNotice = '';
  completeForm.taskId = props.task?.id ?? '';
}

async function submitEmbedding() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  if (!completeForm.samplingBlockId.trim()) {
    ElMessage.warning('请先确认取材块编号');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await completeEmbedding({
      ...payload,
      blockCount: completeForm.blockCount,
      deviceCode: completeForm.deviceCode.trim() || null,
      embeddingBoxNo: completeForm.embeddingBoxNo.trim() || null,
      evaluationLevel: completeForm.evaluationLevel || null,
      samplingBlockId: completeForm.samplingBlockId.trim(),
      samplingEvaluation: completeForm.samplingEvaluation.trim() || null,
      sliceNotice: completeForm.sliceNotice.trim() || null,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(
      result.markingSuccess
        ? `包埋完成，包埋盒 ${result.embeddingBoxId} 打号成功`
        : `包埋完成，打号结果：${formatNullable(result.markingMessage)}`,
    );
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
    title="包埋处理"
    width="880px"
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
          {{ formatNullable(currentTaskContext.taskId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(currentTaskContext.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(currentTaskContext.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="取材块编号">
          {{ formatNullable(currentTaskContext.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="108px">
        <TechnicalOperatorFields
          :form="operatorForm"
          terminal-placeholder="包埋终端编码"
        />
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="取材块编号" required>
            <ElInput
              v-model="completeForm.samplingBlockId"
              placeholder="由当前任务带入"
              readonly
            />
          </ElFormItem>
          <ElFormItem label="包埋盒编号">
            <ElInput
              v-model="completeForm.embeddingBoxNo"
              placeholder="请输入包埋盒编号"
            />
          </ElFormItem>
          <ElFormItem label="蜡块数量" required>
            <ElInputNumber
              v-model="completeForm.blockCount"
              :min="1"
              class="w-full"
            />
          </ElFormItem>
          <ElFormItem label="评估等级">
            <ElSelect
              v-model="completeForm.evaluationLevel"
              clearable
              placeholder="请选择评估等级"
            >
              <ElOption
                v-for="option in EVALUATION_LEVEL_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="设备编码">
            <ElInput
              v-model="completeForm.deviceCode"
              placeholder="请输入设备编码"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="切片提示">
          <ElInput
            v-model="completeForm.sliceNotice"
            placeholder="请输入切片提示"
          />
        </ElFormItem>
        <ElFormItem label="取材评估">
          <ElInput
            v-model="completeForm.samplingEvaluation"
            :rows="3"
            placeholder="请输入采样评价或退回说明"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitEmbedding">
        完成包埋
      </ElButton>
    </template>
  </ElDialog>
</template>
