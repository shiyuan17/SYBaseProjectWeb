<script setup lang="ts">
import type {
  DehydrationBatchResult,
  PendingTechnicalTaskItem,
  TechnicalOperatorFormValue,
  TechnicalTrackingView as TechnicalTrackingViewModel,
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
  ElOption,
  ElSelect,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  createDehydrationBatch,
  getTechnicalTracking,
} from '../api/technical-workflow-service';
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
  tasks?: PendingTechnicalTaskItem[];
}>();

const emit = defineEmits<{
  created: [result: DehydrationBatchResult];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const submitting = ref(false);
const trackingLoading = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

const createForm = reactive({
  basketNo: '',
  caseId: '',
  deviceNo: '',
  samplingBlockIdsText: '',
  selectedSamplingBlockIds: [] as string[],
});

const currentTaskContext = computed(() => ({
  caseId: createForm.caseId || props.task?.caseId || '',
  objectId: props.task?.objectId ?? '',
  objectType: props.task?.objectType ?? '',
  pathologyNo: props.task?.pathologyNo ?? '',
  taskId: props.task?.id ?? '',
}));

const selectedTasks = computed(() => {
  if (props.tasks && props.tasks.length > 0) {
    return props.tasks;
  }
  if (props.task) {
    return [props.task];
  }
  return [];
});

function parseSamplingBlockIds() {
  const manualIds = createForm.samplingBlockIdsText
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([...createForm.selectedSamplingBlockIds, ...manualIds])];
}

function resetDialogState() {
  const firstTask = selectedTasks.value[0] ?? null;
  const selectedBlockIds = selectedTasks.value
    .filter((item) => item.objectType === 'SAMPLING_BLOCK' && item.objectId)
    .map((item) => item.objectId as string);
  pageError.value = '';
  trackingResult.value = null;
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  createForm.basketNo = '';
  createForm.caseId = firstTask?.caseId ?? '';
  createForm.deviceNo = '';
  createForm.selectedSamplingBlockIds = [...new Set(selectedBlockIds)];
  createForm.samplingBlockIdsText =
    createForm.selectedSamplingBlockIds.join('\n');
}

async function loadTracking() {
  const caseId = createForm.caseId.trim();
  if (!caseId) {
    ElMessage.warning('当前任务缺少病例编号');
    return;
  }

  trackingLoading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(caseId);
    if (createForm.selectedSamplingBlockIds.length === 0) {
      const blockIds = trackingResult.value.blocks.map((item) => item.blockId);
      createForm.selectedSamplingBlockIds = blockIds;
      createForm.samplingBlockIdsText = blockIds.join('\n');
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingLoading.value = false;
  }
}

async function submitCreateBatch() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  const samplingBlockIds = parseSamplingBlockIds();
  if (!createForm.caseId.trim()) {
    ElMessage.warning('当前缺少病例编号');
    return;
  }
  if (!createForm.basketNo.trim()) {
    ElMessage.warning('请先输入脱水筐编号');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (samplingBlockIds.length === 0) {
    ElMessage.warning('请至少选择一个取材块');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await createDehydrationBatch({
      ...payload,
      basketNo: createForm.basketNo.trim(),
      caseId: createForm.caseId.trim(),
      deviceNo: createForm.deviceNo.trim() || null,
      samplingBlockIds,
    });
    ElMessage.success(`脱水批次 ${result.batchNo} 创建成功`);
    emit('created', result);
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
  async (visible) => {
    if (!visible) {
      return;
    }
    resetDialogState();
    if (createForm.caseId) {
      await loadTracking();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="创建脱水批次"
    width="960px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="任务号">
          {{ formatNullable(currentTaskContext.taskId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病例编号">
          {{ formatNullable(currentTaskContext.caseId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(currentTaskContext.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(currentTaskContext.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象编号" :span="2">
          {{ formatNullable(currentTaskContext.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="108px">
        <TechnicalOperatorFields
          :form="operatorForm"
          terminal-placeholder="脱水终端编码"
        />
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="病例编号" required>
            <ElInput
              v-model="createForm.caseId"
              placeholder="由当前任务带入"
              readonly
            />
          </ElFormItem>
          <ElFormItem label="脱水筐编号" required>
            <ElInput
              v-model="createForm.basketNo"
              placeholder="请输入脱水筐编号"
            />
          </ElFormItem>
          <ElFormItem label="设备编号">
            <ElInput
              v-model="createForm.deviceNo"
              placeholder="请输入设备编号"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="取材块选择" required>
          <ElSelect
            v-model="createForm.selectedSamplingBlockIds"
            collapse-tags
            collapse-tags-tooltip
            filterable
            multiple
            placeholder="请选择当前病例下的取材块"
            style="width: 100%"
          >
            <ElOption
              v-for="block in trackingResult?.blocks ?? []"
              :key="block.blockId"
              :label="`${block.blockCode || block.blockId} / ${block.description || '未命名取材块'}`"
              :value="block.blockId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="批量粘贴编号">
          <ElInput
            v-model="createForm.samplingBlockIdsText"
            :rows="4"
            placeholder="支持换行、空格或逗号分隔多个取材块编号"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>

      <div class="flex items-center justify-between">
        <div
          v-if="trackingResult"
          class="text-sm text-[var(--el-text-color-secondary)]"
        >
          {{
            `病例状态：${formatCaseStatus(trackingResult.caseStatus)}，可选取材块 ${trackingResult.blocks.length} 个`
          }}
        </div>
        <ElButton :loading="trackingLoading" @click="loadTracking">
          刷新病例取材块
        </ElButton>
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitCreateBatch">
        创建批次
      </ElButton>
    </template>
  </ElDialog>
</template>
