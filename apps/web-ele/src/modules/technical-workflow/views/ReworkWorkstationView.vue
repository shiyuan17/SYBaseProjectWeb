<script setup lang="ts">
import type { TechnicalTrackingView as TechnicalTrackingViewModel } from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  createReworkOrder,
  executeReworkOrder,
  getTechnicalTracking,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { QC_TYPE_OPTIONS, REWORK_TYPE_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEvaluationResult,
  formatNullable,
  formatQcType,
  formatReworkType,
  formatTaskStatus,
} from '../utils/format';

const route = useRoute();
const userStore = useUserStore();

const pageError = ref('');
const actionLoading = ref(false);
const trackingLoading = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);

const operatorForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  terminalCode: '',
});

const createForm = reactive({
  caseId: typeof route.query.caseId === 'string' ? route.query.caseId : '',
  embeddingBoxId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'EMBEDDING_BOX'
      ? route.query.objectId
      : '',
  qcType: '',
  reason: '',
  reworkType: 'RESTAIN',
  samplingBlockId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SAMPLING_BLOCK'
      ? route.query.objectId
      : '',
  slideId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SLIDE'
      ? route.query.objectId
      : '',
  specimenId:
    typeof route.query.objectId === 'string' && route.query.objectType === 'SPECIMEN'
      ? route.query.objectId
      : '',
});

const executeForm = reactive({
  reworkOrderId: '',
});

const targetObjectOptions = computed(() => {
  if (!trackingResult.value) {
    return [];
  }
  if (createForm.reworkType === 'REGROSSING') {
    return trackingResult.value.specimens.map((item) => ({
      label: `${item.specimenNo || item.specimenId} / ${item.specimenName || '未命名标本'}`,
      value: item.specimenId,
    }));
  }
  if (createForm.reworkType === 'REEMBED') {
    return trackingResult.value.blocks.map((item) => ({
      label: `${item.blockCode || item.blockId} / ${item.description || '未命名蜡块'}`,
      value: item.blockId,
    }));
  }
  if (createForm.reworkType === 'RESLICE') {
    return trackingResult.value.embeddingBoxes.map((item) => ({
      label: `${item.embeddingBoxNo || item.embeddingBoxId} / 玻片数 ${item.slideCount}`,
      value: item.embeddingBoxId,
    }));
  }
  return trackingResult.value.slides.map((item) => ({
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

function normalizeOperatorPayload() {
  return {
    operatorName: operatorForm.operatorName.trim(),
    operatorUserId: operatorForm.operatorUserId.trim() || null,
    remarks: operatorForm.remarks.trim() || null,
    terminalCode: operatorForm.terminalCode.trim() || null,
  };
}

function adoptReworkOrder(reworkOrderId: string) {
  executeForm.reworkOrderId = reworkOrderId;
}

async function loadTracking() {
  const caseId = createForm.caseId.trim();
  if (!caseId) {
    ElMessage.warning('请先输入病例编号');
    return;
  }

  trackingLoading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(caseId);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    trackingLoading.value = false;
  }
}

async function submitCreateRework() {
  const payload = normalizeOperatorPayload();
  if (!createForm.caseId.trim()) {
    ElMessage.warning('请先输入病例编号');
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

  actionLoading.value = true;
  pageError.value = '';
  try {
    await createReworkOrder({
      ...payload,
      caseId: createForm.caseId.trim(),
      embeddingBoxId: createForm.embeddingBoxId.trim() || null,
      qcType: createForm.qcType || null,
      reason: createForm.reason.trim(),
      reworkType: createForm.reworkType,
      samplingBlockId: createForm.samplingBlockId.trim() || null,
      slideId: createForm.slideId.trim() || null,
      specimenId: createForm.specimenId.trim() || null,
    });
    ElMessage.success('返工单创建成功');
    await loadTracking();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitExecuteRework() {
  const payload = normalizeOperatorPayload();
  if (!executeForm.reworkOrderId.trim()) {
    ElMessage.warning('请先选择返工单');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先选择操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await executeReworkOrder(executeForm.reworkOrderId.trim(), payload);
    ElMessage.success('返工单执行成功');
    await loadTracking();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

if (createForm.caseId) {
  void loadTracking();
}

watch(
  () => createForm.reworkType,
  () => {
    createForm.embeddingBoxId = '';
    createForm.samplingBlockId = '';
    createForm.slideId = '';
    createForm.specimenId = '';
  },
);

function handleOperatorChange(user: null | { id: string; name: string }) {
  operatorForm.operatorUserId = user?.id ?? '';
  operatorForm.operatorName = user?.name ?? '';
}
</script>

<template>
  <Page
    title="返工工作站"
    description="支持创建与执行返工单，并通过病例级追踪查看返工、质控和对象上下文。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="操作上下文" description="创建与执行返工单共用当前操作人、终端和备注信息。">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="操作人" required>
              <SystemUserSelect
                v-model="operatorForm.operatorUserId"
                :selected-label="operatorForm.operatorName"
                placeholder="请选择操作人"
                @change="handleOperatorChange"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="operatorForm.terminalCode" placeholder="返工工作站终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="operatorForm.remarks" placeholder="必要时补充返工说明" />
            </ElFormItem>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="创建返工单" description="可针对病例、标本、蜡块、包埋盒或玻片创建返工单。">
        <ElDescriptions :column="2" border class="mb-4">
          <ElDescriptionsItem label="病例编号">
            {{ formatNullable(createForm.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(trackingResult?.pathologyNo) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="病例编号" required>
              <ElInput v-model="createForm.caseId" placeholder="请输入病例编号" />
            </ElFormItem>
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
                :model-value="
                  createForm.reworkType === 'REGROSSING'
                    ? createForm.specimenId
                    : createForm.reworkType === 'REEMBED'
                      ? createForm.samplingBlockId
                      : createForm.reworkType === 'RESLICE'
                        ? createForm.embeddingBoxId
                        : createForm.slideId
                "
                clearable
                filterable
                :placeholder="`请选择${targetObjectLabel}`"
                style="width: 100%"
                @update:model-value="
                  (value) => {
                    createForm.specimenId = createForm.reworkType === 'REGROSSING' ? value : '';
                    createForm.samplingBlockId = createForm.reworkType === 'REEMBED' ? value : '';
                    createForm.embeddingBoxId = createForm.reworkType === 'RESLICE' ? value : '';
                    createForm.slideId = createForm.reworkType === 'RESTAIN' ? value : '';
                  }
                "
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
          <div class="flex justify-end gap-2">
            <ElButton :loading="trackingLoading" @click="loadTracking">加载病例追踪</ElButton>
            <ElButton :loading="actionLoading" type="primary" @click="submitCreateRework">
              创建返工单
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="执行返工单" description="优先从病例追踪结果中选择返工单，也支持直接带入待执行返工单。">
        <ElForm inline label-width="96px">
          <ElFormItem label="返工单" required>
            <ElSelect
              v-model="executeForm.reworkOrderId"
              clearable
              filterable
              placeholder="请选择返工单"
              style="width: 280px"
            >
              <ElOption
                v-for="rework in trackingResult?.reworks ?? []"
                :key="rework.reworkOrderId"
                :label="`${rework.reworkOrderId} / ${rework.reworkType || '未命名类型'} / ${rework.status || '未知状态'}`"
                :value="rework.reworkOrderId"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="actionLoading" type="success" @click="submitExecuteRework">
              执行返工单
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="trackingResult"
        title="病例返工与质控概览"
        description="用于确认当前病例已有返工单、质控记录和对象上下文。"
      >
        <ElTable :data="trackingResult.reworks" border>
          <ElTableColumn label="返工单号" min-width="180" prop="reworkOrderId" />
          <ElTableColumn label="返工类型" min-width="140">
            <template #default="{ row }">
              {{ formatReworkType(row.reworkType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              {{ formatTaskStatus(row.status) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="原因" min-width="220">
            <template #default="{ row }">
              {{ formatNullable(row.reason) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="adoptReworkOrder(row.reworkOrderId)">
                带入执行
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElTable :data="trackingResult.qcEvaluations" border class="mt-4">
          <ElTableColumn label="玻片编号" min-width="180" prop="slideId" />
          <ElTableColumn label="玻片号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.slideNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="质控类型" min-width="120">
            <template #default="{ row }">
              {{ formatQcType(row.qcType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="评估结果" min-width="140">
            <template #default="{ row }">
              {{ formatEvaluationResult(row.evaluationResult) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="改进建议" min-width="220">
            <template #default="{ row }">
              {{ formatNullable(row.improvementSuggestion) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="评估时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.evaluatedAt) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
