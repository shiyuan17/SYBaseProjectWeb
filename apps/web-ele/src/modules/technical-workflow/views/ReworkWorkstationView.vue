<script setup lang="ts">
import type { TechnicalTrackingView as TechnicalTrackingViewModel } from '../types/technical-workflow';

import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createReworkOrder,
  executeReworkOrder,
  getTechnicalTracking,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { QC_TYPE_OPTIONS, REWORK_TYPE_OPTIONS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

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
    ElMessage.warning('请先输入病例 ID');
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
    ElMessage.warning('请先输入病例 ID');
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
    ElMessage.warning('请先填写操作人');
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
    ElMessage.warning('请先输入返工单 ID');
    return;
  }
  if (!payload.operatorName) {
    ElMessage.warning('请先填写操作人');
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
              <ElInput v-model="operatorForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="operatorForm.operatorUserId" placeholder="请输入操作人用户 ID" />
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
        <ElForm label-width="108px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="病例 ID" required>
              <ElInput v-model="createForm.caseId" placeholder="请输入 caseId" />
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
            <ElFormItem label="标本 ID">
              <ElInput v-model="createForm.specimenId" placeholder="请输入 specimenId" />
            </ElFormItem>
            <ElFormItem label="取材块 ID">
              <ElInput v-model="createForm.samplingBlockId" placeholder="请输入 samplingBlockId" />
            </ElFormItem>
            <ElFormItem label="包埋盒 ID">
              <ElInput v-model="createForm.embeddingBoxId" placeholder="请输入 embeddingBoxId" />
            </ElFormItem>
            <ElFormItem label="玻片 ID">
              <ElInput v-model="createForm.slideId" placeholder="请输入 slideId" />
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

      <WorkflowSectionCard title="执行返工单" description="可手工输入返工单 ID，也可从下方病例追踪结果中直接带入。">
        <ElForm inline label-width="96px">
          <ElFormItem label="返工单 ID" required>
            <ElInput
              v-model="executeForm.reworkOrderId"
              placeholder="请输入 reworkOrderId"
              style="width: 280px"
            />
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
          <ElTableColumn label="返工单 ID" min-width="180" prop="reworkOrderId" />
          <ElTableColumn label="返工类型" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.reworkType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.status) }}
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
          <ElTableColumn label="玻片 ID" min-width="180" prop="slideId" />
          <ElTableColumn label="玻片号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.slideNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="质控类型" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.qcType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="评估结果" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.evaluationResult) }}
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
