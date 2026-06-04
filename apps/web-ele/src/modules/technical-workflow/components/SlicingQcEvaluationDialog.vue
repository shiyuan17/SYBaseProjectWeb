<script setup lang="ts">
import type {
  CreateSlideQcEvaluationRequest,
  SlicingWorkbenchRow,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  createReworkOrder,
  createSlideQcEvaluation,
} from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';

const props = defineProps<{
  modelValue: boolean;
  row: null | SlicingWorkbenchRow;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const QC_EVALUATION_RESULT_OPTIONS = [
  { label: '合格', value: 'QUALIFIED' },
  { label: '需返工', value: 'REWORK_REQUIRED' },
  { label: '不合格', value: 'UNQUALIFIED' },
] as const;

const QC_REWORK_TYPE_OPTIONS = [
  { label: '重染', value: 'RESTAIN' },
  { label: '重切', value: 'RESLICE' },
  { label: '重新取材', value: 'REGROSSING' },
] as const;

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const pageError = ref('');
const submitting = ref(false);

const form = reactive({
  evaluationResult: 'QUALIFIED',
  improvementSuggestion: '',
  issueDescription: '',
  qcType: 'HE',
  remarks: '',
  reworkType: 'RESTAIN',
  terminalCode: '',
});

const requiresRework = computed(() =>
  ['REWORK_REQUIRED', 'UNQUALIFIED'].includes(form.evaluationResult),
);

function resetDialogState() {
  pageError.value = '';
  form.evaluationResult = 'QUALIFIED';
  form.improvementSuggestion = '';
  form.issueDescription = '';
  form.qcType = 'HE';
  form.remarks = '';
  form.reworkType = 'RESTAIN';
  form.terminalCode = '';
}

function buildQcPayload(): CreateSlideQcEvaluationRequest | null {
  if (!props.row?.caseId || !props.row.slideId || !props.row.specimenId) {
    ElMessage.warning('当前缺少可评价的切片记录');
    return null;
  }
  return {
    caseId: props.row.caseId,
    evaluationResult: form.evaluationResult,
    improvementSuggestion: form.improvementSuggestion.trim() || null,
    issueDescription: form.issueDescription.trim() || null,
    qcType: form.qcType,
    remarks: form.remarks.trim() || null,
    slideId: props.row.slideId,
    specimenId: props.row.specimenId,
    terminalCode: form.terminalCode.trim() || null,
  };
}

async function submitEvaluation() {
  const row = props.row;
  const qcPayload = buildQcPayload();
  if (!row || !qcPayload) {
    return;
  }
  if (requiresRework.value && !form.issueDescription.trim()) {
    ElMessage.warning('异常评价时请补充问题描述');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    await createSlideQcEvaluation(qcPayload);

    if (requiresRework.value) {
      try {
        await createReworkOrder({
          caseId: row.caseId,
          embeddingBoxId:
            form.reworkType === 'RESLICE' ? row.embeddingBoxId : null,
          qcType: form.qcType,
          reason:
            form.issueDescription.trim() ||
            `切片质控结果为 ${form.evaluationResult}`,
          remarks: form.remarks.trim() || null,
          reworkType: form.reworkType,
          slideId: form.reworkType === 'RESTAIN' ? row.slideId : null,
          specimenId: row.specimenId ?? null,
          terminalCode: form.terminalCode.trim() || null,
        });
        ElMessage.success('质控评价与返工单已创建');
      } catch (error) {
        pageError.value = getWorkflowPageErrorMessage(error);
        reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
        ElMessage.warning('质控评价已提交，返工单创建失败，请稍后补录');
        emit('submitted');
        dialogVisible.value = false;
        return;
      }
    } else {
      ElMessage.success('质控评价提交成功');
    }

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
    title="切片质控评价"
    width="760px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
      />

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(row?.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病人">
          {{ formatNullable(row?.patientName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病人ID">
          {{ formatNullable(row?.patientId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="玻片号">
          {{ formatNullable(row?.slideNo) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="108px">
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="质控类型" required>
            <ElSelect v-model="form.qcType" placeholder="请选择质控类型">
              <ElOption label="HE" value="HE" />
              <ElOption label="免疫组化" value="IHC" />
              <ElOption label="特殊染色" value="SPECIAL_STAIN" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="评价结果" required>
            <ElSelect
              v-model="form.evaluationResult"
              placeholder="请选择评价结果"
            >
              <ElOption
                v-for="option in QC_EVALUATION_RESULT_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="requiresRework" label="返工类型" required>
            <ElSelect v-model="form.reworkType" placeholder="请选择返工类型">
              <ElOption
                v-for="option in QC_REWORK_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput
              v-model="form.terminalCode"
              placeholder="请输入切片工位终端编码"
            />
          </ElFormItem>
        </div>

        <ElFormItem label="问题描述" :required="requiresRework">
          <ElInput
            v-model="form.issueDescription"
            :rows="3"
            placeholder="请输入本次质控发现的问题"
            type="textarea"
          />
        </ElFormItem>

        <ElFormItem label="改进建议">
          <ElInput
            v-model="form.improvementSuggestion"
            :rows="3"
            placeholder="必要时填写改进建议"
            type="textarea"
          />
        </ElFormItem>

        <ElFormItem label="备注">
          <ElInput
            v-model="form.remarks"
            :rows="2"
            placeholder="必要时补充备注"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitEvaluation">
        提交评价
      </ElButton>
    </template>
  </ElDialog>
</template>
