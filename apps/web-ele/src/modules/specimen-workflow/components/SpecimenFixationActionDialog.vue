<script setup lang="ts">
import type {
  ApplicationDetailView,
  PendingSpecimenItem,
  SpecimenFixationRequest,
} from '../types/specimen-workflow';

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

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import { formatDate, formatDateTime, formatNullable } from '../utils/format';

type FixationAction = 'complete' | 'start';

const props = withDefaults(
  defineProps<{
    action: FixationAction;
    applicationDetail?: ApplicationDetailView | null;
    loading?: boolean;
    modelValue: boolean;
    row: null | PendingSpecimenItem;
  }>(),
  {
    applicationDetail: null,
    loading: false,
  },
);

const emit = defineEmits<{
  submit: [payload: SpecimenFixationRequest];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());
const form = reactive({
  fixationLiquidType: '',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  specimenBarcode: '',
  terminalCode: '',
});

const currentUserName = computed(
  () => userStore.userInfo?.realName?.trim() ?? '',
);
const currentUserId = computed(() => userStore.userInfo?.userId?.trim() ?? '');

function resetForm() {
  form.fixationLiquidType = props.row?.fixationLiquidType?.trim() ?? '';
  form.operatorName = currentUserName.value;
  form.operatorUserId = currentUserId.value;
  form.remarks = '';
  form.specimenBarcode = props.row?.barcode?.trim() ?? '';
  form.terminalCode = '';
}

async function ensureReferenceOptionsLoaded() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
    enabled: true,
  });
}

watch(
  () => [dialogVisible.value, props.row?.barcode, props.action] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    resetForm();
    void ensureReferenceOptionsLoaded();
  },
  { immediate: true },
);

watch(
  () => [currentUserId.value, currentUserName.value] as const,
  () => {
    if (!dialogVisible.value) {
      return;
    }
    form.operatorName = currentUserName.value;
    form.operatorUserId = currentUserId.value;
  },
);

function getDialogTitle() {
  return props.action === 'start' ? '开始固定' : '完成固定';
}

function getSubmitButtonText() {
  return props.action === 'start' ? '确认开始固定' : '确认完成固定';
}

function submit() {
  const specimenBarcode = form.specimenBarcode.trim();
  if (!specimenBarcode) {
    ElMessage.warning('缺少标本条码');
    return;
  }
  if (!form.operatorName.trim()) {
    ElMessage.warning('请选择操作人');
    return;
  }
  if (!form.fixationLiquidType.trim()) {
    ElMessage.warning(
      props.action === 'start'
        ? '请选择固定液类型'
        : '请补齐固定液类型后再完成固定',
    );
    return;
  }

  emit('submit', {
    fixationLiquidType: form.fixationLiquidType.trim(),
    remarks: form.remarks.trim() || null,
    specimenBarcode,
    terminalCode: form.terminalCode.trim() || null,
  });
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    :title="getDialogTitle()"
    width="760px"
  >
    <template v-if="row">
      <div class="flex flex-col gap-4">
        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单号">
              {{ row.applicationNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{ formatNullable(row.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本号">
              {{ row.specimenNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="条码">
              {{ row.barcode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{ formatNullable(row.submittingDepartmentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="登记时间">
              {{ formatDateTime(row.registeredAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="离体时间">
              {{ formatDateTime(applicationDetail?.specimenRemovalTime) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检日期">
              {{ formatDate(applicationDetail?.submissionDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前固定液">
              {{ formatNullable(row.fixationLiquidType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="开始固定时间">
              {{ formatDateTime(row.fixationStartedAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="完成固定时间">
              {{ formatDateTime(row.fixationCompletedAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="最近追踪时间">
              {{ formatDateTime(row.latestTrackingAt) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </section>

        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <ElForm label-width="96px">
            <div class="grid gap-4 md:grid-cols-2">
              <ElFormItem label="操作人" required>
                <ElInput :model-value="form.operatorName" disabled />
              </ElFormItem>
              <ElFormItem label="固定液类型" required>
                <ReferenceOptionSelect
                  v-model="form.fixationLiquidType"
                  :options="workflowReferenceOptions.fixationLiquidTypes"
                  placeholder="请选择或输入固定液"
                />
              </ElFormItem>
              <ElFormItem label="终端编码">
                <ElInput
                  v-model="form.terminalCode"
                  placeholder="工作站或扫码设备编号"
                />
              </ElFormItem>
            </div>
            <ElFormItem label="备注">
              <ElInput
                v-model="form.remarks"
                :rows="2"
                placeholder="必要时补充固定说明"
                type="textarea"
              />
            </ElFormItem>
          </ElForm>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="loading" type="primary" @click="submit">
          {{ getSubmitButtonText() }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
