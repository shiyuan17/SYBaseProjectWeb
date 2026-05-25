<script setup lang="ts">
import type {
  ReworkOrderResult,
  TechnicalOperatorFormValue,
  TechnicalTrackingView as TechnicalTrackingViewModel,
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
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { createReworkOrder } from '../api/technical-workflow-service';
import { QC_TYPE_OPTIONS, REWORK_TYPE_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = withDefaults(
  defineProps<{
    caseId: string;
    initialObjectId?: string;
    initialObjectType?: null | string;
    modelValue: boolean;
    trackingResult: null | TechnicalTrackingViewModel;
  }>(),
  {
    initialObjectId: '',
    initialObjectType: '',
  },
);

const emit = defineEmits<{
  submitted: [result: ReworkOrderResult];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const resettingForm = ref(false);
const submitting = ref(false);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

const createForm = reactive({
  embeddingBoxId: '',
  qcType: '',
  reason: '',
  reworkType: 'RESTAIN',
  samplingBlockId: '',
  slideId: '',
  specimenId: '',
});

const targetObjectOptions = computed(() => {
  if (!props.trackingResult) {
    return [];
  }
  if (createForm.reworkType === 'REGROSSING') {
    return props.trackingResult.specimens.map((item) => ({
      label: `${item.specimenNo || item.specimenId} / ${item.specimenName || '未命名标本'}`,
      value: item.specimenId,
    }));
  }
  if (createForm.reworkType === 'REEMBED') {
    return props.trackingResult.blocks.map((item) => ({
      label: `${item.blockCode || item.blockId} / ${item.description || '未命名蜡块'}`,
      value: item.blockId,
    }));
  }
  if (createForm.reworkType === 'RESLICE') {
    return props.trackingResult.embeddingBoxes.map((item) => ({
      label: `${item.embeddingBoxNo || item.embeddingBoxId} / 玻片数 ${item.slideCount}`,
      value: item.embeddingBoxId,
    }));
  }
  return props.trackingResult.slides.map((item) => ({
    label: `${item.slideNo || item.slideId} / ${item.qualityStatus || '未评价'}`,
    value: item.slideId,
  }));
});

const targetObjectLabel = computed(() => {
  if (createForm.reworkType === 'REGROSSING') {
    return '标本';
  }
  if (createForm.reworkType === 'REEMBED') {
    return '取材块';
  }
  if (createForm.reworkType === 'RESLICE') {
    return '包埋盒';
  }
  return '玻片';
});

const selectedObjectValue = computed({
  get: () => {
    if (createForm.reworkType === 'REGROSSING') {
      return createForm.specimenId;
    }
    if (createForm.reworkType === 'REEMBED') {
      return createForm.samplingBlockId;
    }
    if (createForm.reworkType === 'RESLICE') {
      return createForm.embeddingBoxId;
    }
    return createForm.slideId;
  },
  set: (value: string) => {
    createForm.specimenId = createForm.reworkType === 'REGROSSING' ? value : '';
    createForm.samplingBlockId = createForm.reworkType === 'REEMBED' ? value : '';
    createForm.embeddingBoxId = createForm.reworkType === 'RESLICE' ? value : '';
    createForm.slideId = createForm.reworkType === 'RESTAIN' ? value : '';
  },
});

function applyInitialObject() {
  resettingForm.value = true;
  createForm.embeddingBoxId = '';
  createForm.samplingBlockId = '';
  createForm.slideId = '';
  createForm.specimenId = '';

  if (props.initialObjectType === 'SPECIMEN') {
    createForm.reworkType = 'REGROSSING';
    createForm.specimenId = props.initialObjectId;
    resettingForm.value = false;
    return;
  }
  if (props.initialObjectType === 'SAMPLING_BLOCK') {
    createForm.reworkType = 'REEMBED';
    createForm.samplingBlockId = props.initialObjectId;
    resettingForm.value = false;
    return;
  }
  if (props.initialObjectType === 'EMBEDDING_BOX') {
    createForm.reworkType = 'RESLICE';
    createForm.embeddingBoxId = props.initialObjectId;
    resettingForm.value = false;
    return;
  }
  createForm.reworkType = 'RESTAIN';
  createForm.slideId = props.initialObjectId;
  resettingForm.value = false;
}

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  createForm.qcType = '';
  createForm.reason = '';
  applyInitialObject();
}

async function submitCreateRework() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!props.caseId.trim()) {
    ElMessage.warning('请先加载病例');
    return;
  }
  if (!createForm.reworkType) {
    ElMessage.warning('请选择返工类型');
    return;
  }
  if (!createForm.reason.trim()) {
    ElMessage.warning('请先输入返工原因');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await createReworkOrder({
      ...payload,
      caseId: props.caseId.trim(),
      embeddingBoxId: createForm.embeddingBoxId.trim() || null,
      qcType: createForm.qcType || null,
      reason: createForm.reason.trim(),
      reworkType: createForm.reworkType,
      samplingBlockId: createForm.samplingBlockId.trim() || null,
      slideId: createForm.slideId.trim() || null,
      specimenId: createForm.specimenId.trim() || null,
    });
    ElMessage.success('返工单创建成功');
    emit('submitted', result);
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

watch(
  () => createForm.reworkType,
  () => {
    if (resettingForm.value) {
      return;
    }
    selectedObjectValue.value = '';
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="创建返工单"
    width="920px"
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
        <ElDescriptionsItem label="病例编号">
          {{ formatNullable(caseId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(trackingResult?.pathologyNo) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="108px">
        <TechnicalOperatorFields
          :form="operatorForm"
          remarks-placeholder="必要时补充返工说明"
          terminal-placeholder="返工工作站终端编码"
        />
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="返工类型" required>
            <ElSelect v-model="createForm.reworkType" placeholder="请选择返工类型">
              <ElOption
                v-for="option in REWORK_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="质控类型">
            <ElSelect v-model="createForm.qcType" clearable placeholder="请选择质控类型">
              <ElOption
                v-for="option in QC_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem :label="`${targetObjectLabel}选择`">
            <ElSelect
              v-model="selectedObjectValue"
              clearable
              filterable
              :placeholder="`请选择${targetObjectLabel}`"
              style="width: 100%"
            >
              <ElOption
                v-for="option in targetObjectOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>
        <ElFormItem label="返工原因" required>
          <ElInput
            v-model="createForm.reason"
            :rows="3"
            placeholder="请输入返工原因"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitCreateRework">
        创建返工单
      </ElButton>
    </template>
  </ElDialog>
</template>
