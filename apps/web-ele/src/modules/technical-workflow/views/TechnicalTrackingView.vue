<script setup lang="ts">
import type { TechnicalTrackingView as TechnicalTrackingViewModel } from '../types/technical-workflow';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getTechnicalTracking } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

const route = useRoute();

const pageError = ref('');
const loading = ref(false);
const caseId = ref(typeof route.query.caseId === 'string' ? route.query.caseId : '');
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

async function loadTracking() {
  const normalizedCaseId = caseId.value.trim();
  if (!normalizedCaseId) {
    pageError.value = '请输入病例 ID';
    trackingResult.value = null;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(normalizedCaseId);
  } catch (error) {
    trackingResult.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  caseId.value = '';
  pageError.value = '';
  trackingResult.value = null;
}

if (caseId.value) {
  void loadTracking();
}
</script>

<template>
  <Page
    title="技术追踪"
    description="按病例维度查看任务、标本、蜡块、包埋盒、玻片、质控历史、返工单与流程事件。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="病例查询"
        description="当前仅支持按 `caseId` 查询，避免前端推导条码或任务维度的非标准追踪入口。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID" required>
            <ElInput
              v-model="caseId"
              clearable
              placeholder="请输入 caseId"
              style="width: 260px"
              @keyup.enter="loadTracking"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadTracking">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <template v-if="trackingResult">
        <WorkflowSectionCard title="病例摘要" description="展示当前病例在技术流程中的主状态。">
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="病例 ID">
              {{ trackingResult.caseId }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="病理号">
              {{ formatNullable(trackingResult.pathologyNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="病例状态">
              {{ formatNullable(trackingResult.caseStatus) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="技术任务" description="病例维度下的全部技术任务轨迹。">
          <ElTable :data="trackingResult.technicalTasks" border>
            <ElTableColumn label="任务 ID" min-width="180" prop="id" />
            <ElTableColumn label="任务类型" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.taskType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="任务状态" min-width="120">
              <template #default="{ row }">
                <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                  {{ formatNullable(row.taskStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="对象类型" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.objectType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="对象 ID" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.objectId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="创建时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="完成时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.completedAt) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="标本摘要" description="追踪病例下所有参与技术流程的标本。">
          <ElTable :data="trackingResult.specimens" border>
            <ElTableColumn label="标本 ID" min-width="180" prop="specimenId" />
            <ElTableColumn label="标本号" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.specimenNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="条码" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.barcode) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本名称" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.specimenName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.specimenStatus) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="蜡块摘要" description="蜡块用于串联取材、脱水、包埋等上游节点。">
          <ElTable :data="trackingResult.blocks" border>
            <ElTableColumn label="蜡块 ID" min-width="180" prop="blockId" />
            <ElTableColumn label="所属标本 ID" min-width="180" prop="specimenId" />
            <ElTableColumn label="蜡块编码" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.blockCode) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋盒号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingBoxNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="描述" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.description) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="包埋盒摘要" description="追踪包埋盒编号、切片提示与玻片数量。">
          <ElTable :data="trackingResult.embeddingBoxes" border>
            <ElTableColumn label="包埋盒 ID" min-width="180" prop="embeddingBoxId" />
            <ElTableColumn label="所属标本 ID" min-width="180" prop="specimenId" />
            <ElTableColumn label="包埋盒号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingBoxNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片提示" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.sliceNotice) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="玻片数量" min-width="120" prop="slideCount" />
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="玻片摘要" description="展示玻片状态、所属包埋盒以及质控状态。">
          <ElTable :data="trackingResult.slides" border>
            <ElTableColumn label="玻片 ID" min-width="180" prop="slideId" />
            <ElTableColumn label="玻片号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.slideNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="所属标本 ID" min-width="180" prop="specimenId" />
            <ElTableColumn label="所属包埋盒 ID" min-width="180" prop="embeddingBoxId" />
            <ElTableColumn label="玻片状态" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.slideStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="质控状态" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.qualityStatus) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="质控历史" description="返工前后的质控记录用于还原问题来源。">
          <ElTable :data="trackingResult.qcEvaluations" border>
            <ElTableColumn label="质控 ID" min-width="180" prop="qcEvaluationId" />
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
            <ElTableColumn label="问题描述" min-width="200">
              <template #default="{ row }">
                {{ formatNullable(row.issueDescription) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="改进建议" min-width="200">
              <template #default="{ row }">
                {{ formatNullable(row.improvementSuggestion) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="评估人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.evaluatorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="评估时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.evaluatedAt) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="返工单" description="病例级展示当前已创建的返工单。">
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
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="事件轨迹" description="按事件查看节点、状态、操作人与事件内容。">
          <ElTable :data="trackingResult.events" border>
            <ElTableColumn label="节点编码" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.nodeCode) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="事件类型" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.eventType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="事件状态" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.eventStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="事件时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.eventTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.operatorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="事件内容" min-width="240">
              <template #default="{ row }">
                {{ formatNullable(row.eventContent) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>
      </template>
    </div>
  </Page>
</template>
