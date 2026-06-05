<script setup lang="ts">
import type { TechnicalTrackingEmbeddingRecordSummary } from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadio,
  ElRadioGroup,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { updateEmbeddingQualityReview } from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';

const props = defineProps<{
  modelValue: boolean;
  row: null | TechnicalTrackingEmbeddingRecordSummary;
  title?: string;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const EVALUATION_OPTIONS = [
  { label: '优秀', value: 'EXCELLENT' },
  { label: '合格', value: 'QUALIFIED' },
  { label: '不合格', value: 'UNQUALIFIED' },
] as const;

const UNQUALIFIED_REASON_OPTIONS = [
  '组织过厚',
  '小组织无包被',
  '有线头',
  '有钉子',
  '其他原因',
] as const;

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});
const dialogTitle = computed(() => props.title ?? '取材评价');

const pageError = ref('');
const submitting = ref(false);

const form = reactive({
  customReason: '',
  evaluationLevel: 'QUALIFIED',
  notifiedGrossingOperator: false,
  reasons: [] as string[],
  treatmentAction: '' as '' | 'OTHER' | 'REGROSSING',
  treatmentRemark: '',
});

const isUnqualified = computed(() => form.evaluationLevel === 'UNQUALIFIED');

function resetDialogState() {
  pageError.value = '';
  form.customReason = '';
  form.evaluationLevel = props.row?.evaluationLevel || 'QUALIFIED';
  form.notifiedGrossingOperator = false;
  form.reasons = [];
  form.treatmentAction = '';
  form.treatmentRemark = '';
}

function getSamplingEvaluationText() {
  if (form.evaluationLevel === 'EXCELLENT') {
    return '优秀';
  }
  if (form.evaluationLevel === 'QUALIFIED') {
    return '合格';
  }
  return '不合格';
}

async function submitQualityReview() {
  if (!props.row) {
    ElMessage.warning('请先选择已包埋蜡块');
    return;
  }
  const customReason = form.customReason.trim();
  const reasons = [...form.reasons, ...(customReason ? [customReason] : [])];
  if (isUnqualified.value && reasons.length === 0) {
    ElMessage.warning('不合格评价请填写原因');
    return;
  }
  if (form.treatmentAction === 'OTHER' && !form.treatmentRemark.trim()) {
    ElMessage.warning('请选择其他处理措施时请填写说明');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await updateEmbeddingQualityReview(props.row.embeddingId, {
      evaluationLevel: form.evaluationLevel,
      notifiedGrossingOperator: form.notifiedGrossingOperator,
      samplingEvaluation: getSamplingEvaluationText(),
      sliceNotice: props.row.sliceNotice,
      treatmentAction: form.treatmentAction || null,
      treatmentRemark: form.treatmentRemark.trim() || null,
      unqualifiedReasons: isUnqualified.value ? reasons : [],
    });
    ElMessage.success(
      result.reworkType === 'REGROSSING'
        ? '取材评价已保存，并已生成重新取材待办'
        : '取材评价已保存',
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
  () => [props.modelValue, props.row?.embeddingId],
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
    :title="dialogTitle"
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
        <ElDescriptionsItem label="蜡块号">
          {{ formatNullable(row?.samplingBlockCode) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="标本名称">
          {{ formatNullable(row?.specimenName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="取材人">
          {{ formatNullable(row?.sampledByName) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="112px">
        <ElFormItem label="评价小号">
          <span class="text-base font-semibold text-red-600">
            {{ formatNullable(row?.samplingBlockCode) }}
          </span>
        </ElFormItem>

        <ElFormItem label="评价结果" required>
          <ElRadioGroup v-model="form.evaluationLevel">
            <ElRadio
              v-for="option in EVALUATION_OPTIONS"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="isUnqualified" label="不合格原因" required>
          <div class="flex flex-col gap-3">
            <ElCheckboxGroup v-model="form.reasons">
              <ElCheckbox
                v-for="reason in UNQUALIFIED_REASON_OPTIONS"
                :key="reason"
                :label="reason"
              >
                {{ reason }}
              </ElCheckbox>
            </ElCheckboxGroup>
            <ElInput v-model="form.customReason" placeholder="其他原因说明" />
          </div>
        </ElFormItem>

        <ElFormItem v-if="isUnqualified" label="处理措施">
          <div class="flex flex-col gap-3">
            <ElRadioGroup v-model="form.treatmentAction">
              <ElRadio label="REGROSSING">重新取材</ElRadio>
              <ElRadio label="OTHER">其他</ElRadio>
            </ElRadioGroup>
            <ElInput v-model="form.treatmentRemark" placeholder="处理说明" />
          </div>
        </ElFormItem>

        <ElFormItem v-if="isUnqualified" label="通知状态">
          <ElCheckbox v-model="form.notifiedGrossingOperator">
            已通知取材人
          </ElCheckbox>
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        :loading="submitting"
        type="primary"
        @click="submitQualityReview"
      >
        保存评价
      </ElButton>
    </template>
  </ElDialog>
</template>
