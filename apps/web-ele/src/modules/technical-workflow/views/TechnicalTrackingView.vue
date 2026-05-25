<script setup lang="ts">
import type {
  ObjectProgressNode,
  TechnicalTrackingEventSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTree,
} from 'element-plus';

import { getTechnicalTracking } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCaseStatus,
  formatDateTime,
  formatEvaluationResult,
  formatEventStatus,
  formatEventType,
  formatNullable,
  formatObjectType,
  formatQcType,
  formatQualityStatus,
  formatReworkType,
  formatSlideStatus,
  formatSpecimenStatus,
  formatTaskPriority,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { buildWorkstationCaseContext } from '../utils/workstation';

const route = useRoute();

interface TrackingTreeNode {
  children: TrackingTreeNode[];
  id: string;
  label: string;
  secondaryLabel?: null | string;
  status?: null | string;
  type: ObjectProgressNode['type'];
}

interface WorkflowTimelineStep {
  content: string;
  index: number;
  nodeCode: string;
  operatorName: string;
  status: 'completed' | 'current' | 'pending';
  statusText: string;
  time: string;
  title: string;
}

const workflowStepDefinitions = [
  { nodeCode: 'GROSSING', title: '取材描写' },
  { nodeCode: 'DEHYDRATION', title: '脱水' },
  { nodeCode: 'EMBEDDING', title: '包埋' },
  { nodeCode: 'SLICING', title: '切片' },
  { nodeCode: 'STAINING', title: '染色出片' },
  { nodeCode: 'QUALITY_CONTROL', title: '质控闭环' },
] as const;

const pageError = ref('');
const loading = ref(false);
const caseId = ref(typeof route.query.caseId === 'string' ? route.query.caseId : '');
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const activeTab = ref<'abnormal' | 'timeline' | 'work-items'>('timeline');
const selectedNodeId = ref('');

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

const context = computed(() =>
  trackingResult.value ? buildWorkstationCaseContext(trackingResult.value) : null,
);

const treeData = computed(() => {
  if (!context.value) {
    return [];
  }

  const childrenMap = new Map<string, ObjectProgressNode[]>();
  context.value.progressNodes.forEach((node) => {
    const parentId = node.parentId ?? '__root__';
    childrenMap.set(parentId, [...(childrenMap.get(parentId) ?? []), node]);
  });

  const buildNode = (node: ObjectProgressNode): TrackingTreeNode => ({
    children: (childrenMap.get(node.id) ?? []).map((child) => buildNode(child)),
    id: node.id,
    label: node.label,
    secondaryLabel: node.secondaryLabel,
    status: node.status,
    type: node.type,
  });

  return (childrenMap.get('__root__') ?? []).map((node) => buildNode(node));
});

const selectedNode = computed(() => {
  if (!selectedNodeId.value || !context.value) {
    return null;
  }
  return context.value.progressNodes.find((item) => item.id === selectedNodeId.value) ?? null;
});

const filteredTasks = computed(() => {
  if (!trackingResult.value) {
    return [];
  }
  if (!selectedNode.value || selectedNode.value.type === 'CASE') {
    return trackingResult.value.technicalTasks;
  }
  return trackingResult.value.technicalTasks.filter((item) => item.objectId === selectedNode.value?.id);
});

const filteredReworks = computed(() => {
  if (!trackingResult.value) {
    return [];
  }
  if (!selectedNode.value || selectedNode.value.type === 'CASE') {
    return trackingResult.value.reworks;
  }
  return trackingResult.value.reworks.filter((item) =>
    selectedNode.value?.secondaryLabel
      ? item.reason?.includes(selectedNode.value.secondaryLabel ?? '')
      : true,
  );
});

const filteredQcEvaluations = computed(() => {
  if (!trackingResult.value) {
    return [];
  }
  if (!selectedNode.value || selectedNode.value.type === 'CASE') {
    return trackingResult.value.qcEvaluations;
  }
  if (selectedNode.value.type === 'SLIDE') {
    return trackingResult.value.qcEvaluations.filter((item) => item.slideId === selectedNode.value?.id);
  }
  if (selectedNode.value.type === 'SPECIMEN') {
    return trackingResult.value.qcEvaluations.filter((item) => item.specimenId === selectedNode.value?.id);
  }
  return trackingResult.value.qcEvaluations;
});

function getEventNodeCode(event: TechnicalTrackingEventSummary) {
  const nodeCode = event.nodeCode?.trim();
  if (nodeCode) {
    return nodeCode;
  }
  if (event.eventType === 'EVALUATE') {
    return 'QUALITY_CONTROL';
  }
  return '';
}

function isCompletedEvent(event: TechnicalTrackingEventSummary) {
  return event.eventStatus === 'SUCCESS'
    && ['COMPLETE', 'CREATE_BATCH', 'EVALUATE', 'EXECUTE', 'MARK'].includes(event.eventType ?? '');
}

const workflowTimelineSteps = computed<WorkflowTimelineStep[]>(() => {
  if (!trackingResult.value || !context.value) {
    return [];
  }

  const eventsByNode = new Map<string, TechnicalTrackingEventSummary>();
  context.value.recentEvents.forEach((event) => {
    const nodeCode = getEventNodeCode(event);
    if (!nodeCode || eventsByNode.has(nodeCode)) {
      return;
    }
    eventsByNode.set(nodeCode, event);
  });

  const activeTaskNode = trackingResult.value.technicalTasks.find((task) =>
    task.taskStatus === 'IN_PROGRESS' || task.taskStatus === 'PENDING',
  )?.taskType;
  const completedNodeCodes = new Set(
    trackingResult.value.technicalTasks
      .filter((task) => task.taskStatus === 'COMPLETED' && task.taskType)
      .map((task) => task.taskType as string),
  );
  const completedEventNodeCodes = new Set(
    context.value.recentEvents
      .filter((event) => isCompletedEvent(event))
      .map((event) => getEventNodeCode(event))
      .filter(Boolean),
  );
  let lastCompletedIndex = -1;
  workflowStepDefinitions.forEach((step, index) => {
    if (completedNodeCodes.has(step.nodeCode) || completedEventNodeCodes.has(step.nodeCode)) {
      lastCompletedIndex = index;
    }
  });
  const activeNodeIndex = activeTaskNode
    ? workflowStepDefinitions.findIndex((step) => step.nodeCode === activeTaskNode)
    : -1;
  const currentIndex = activeNodeIndex >= 0
    ? activeNodeIndex
    : Math.min(lastCompletedIndex + 1, workflowStepDefinitions.length - 1);

  return workflowStepDefinitions.map((step, index) => {
    const latestEvent = eventsByNode.get(step.nodeCode);
    const task = trackingResult.value?.technicalTasks.find((item) => item.taskType === step.nodeCode);
    const completed = completedNodeCodes.has(step.nodeCode) || completedEventNodeCodes.has(step.nodeCode);
    const status: WorkflowTimelineStep['status'] = completed
      ? 'completed'
      : (index === currentIndex ? 'current' : 'pending');
    let statusText = '-';
    if (latestEvent) {
      statusText = formatEventStatus(latestEvent.eventStatus);
    } else if (task) {
      statusText = formatTaskStatus(task.taskStatus);
    } else if (status === 'current') {
      statusText = '待处理';
    }

    return {
      content: formatNullable(latestEvent?.eventContent ?? task?.remarks),
      index: index + 1,
      nodeCode: step.nodeCode,
      operatorName: formatNullable(latestEvent?.operatorName ?? task?.assignedToName),
      status,
      statusText,
      time: formatDateTime(latestEvent?.eventTime ?? task?.completedAt ?? task?.startedAt),
      title: step.title,
    };
  });
});

function handleNodeClick(data: { id: string }) {
  selectedNodeId.value = data.id;
}

async function loadTracking() {
  const normalizedCaseId = caseId.value.trim();
  if (!normalizedCaseId) {
    pageError.value = '请输入病例ID、病理号或对象ID';
    trackingResult.value = null;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(normalizedCaseId);
    selectedNodeId.value = trackingResult.value.caseId;
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
  selectedNodeId.value = '';
  trackingResult.value = null;
}

if (caseId.value) {
  void loadTracking();
}
</script>

<template>
  <Page
    title="技术追踪"
    description="按病例维度切换对象树、流程时间线、任务返工与质控异常，不再把所有层级一次平铺。"
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
        description="支持按病例ID、病理号或对象ID进入对象树追踪视图，后续可继续扩展扫码或条码入口。"
      >
        <ElForm inline label-width="112px">
          <ElFormItem label="病例/病理/对象" required>
            <ElInput
              v-model="caseId"
              clearable
              placeholder="请输入病例ID、病理号或对象ID"
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

      <template v-if="trackingResult && context">
        <WorkflowSectionCard title="病例摘要" description="先展示主状态，再进入对象树和时间线追踪。">
          <ElDescriptions :column="4" border>
            <ElDescriptionsItem label="病例编号">{{ trackingResult.caseId }}</ElDescriptionsItem>
            <ElDescriptionsItem label="病理号">{{ formatNullable(trackingResult.pathologyNo) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="病例状态">{{ formatCaseStatus(trackingResult.caseStatus) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="当前聚焦对象">
              {{ selectedNode ? `${selectedNode.label} / ${formatObjectType(selectedNode.type)}` : '病例' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <div class="grid gap-4 xl:grid-cols-[300px_1fr]">
          <WorkflowSectionCard
            title="对象树"
            description="按照病例、标本、蜡块、包埋盒、玻片展开，帮助定位当前追踪对象。"
          >
            <ElTree
              v-if="treeData.length > 0"
              :current-node-key="selectedNodeId"
              :data="treeData"
              default-expand-all
              highlight-current
              node-key="id"
              @node-click="handleNodeClick"
            >
              <template #default="{ data }">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-sm text-foreground">{{ data.label }}</span>
                  <ElTag v-if="data.status" effect="plain" size="small">
                    {{ formatTaskStatus(data.status) }}
                  </ElTag>
                </div>
              </template>
            </ElTree>
            <ElEmpty v-else description="当前病例还没有可追踪对象" />
          </WorkflowSectionCard>

          <WorkflowSectionCard title="追踪详情" description="按时间线、任务返工和质控异常三类查看当前对象。">
            <ElTabs v-model="activeTab">
              <ElTabPane label="流程时间线" name="timeline">
                <div v-if="workflowTimelineSteps.length > 0" class="tracking-flow overflow-x-auto">
                  <ol
                    class="tracking-flow__list"
                    :style="{ '--step-count': workflowTimelineSteps.length }"
                  >
                    <li
                      v-for="step in workflowTimelineSteps"
                      :key="step.nodeCode"
                      class="tracking-flow__item"
                      :class="`is-${step.status}`"
                    >
                      <div class="tracking-flow__marker">
                        <span v-if="step.status === 'completed'">✓</span>
                        <span v-else-if="step.status === 'current'" class="tracking-flow__current-dot"></span>
                        <span v-else>{{ step.index }}</span>
                      </div>
                      <div class="tracking-flow__body">
                        <div class="tracking-flow__title">{{ step.title }}</div>
                        <div class="tracking-flow__time">{{ step.time }}</div>
                        <div class="tracking-flow__meta">
                          <ElTag
                            v-if="step.statusText !== '-'"
                            effect="plain"
                            size="small"
                            :type="step.status === 'completed' ? 'success' : step.status === 'current' ? 'primary' : 'info'"
                          >
                            {{ step.statusText }}
                          </ElTag>
                          <span>{{ step.operatorName }}</span>
                        </div>
                        <div class="tracking-flow__content">{{ step.content }}</div>
                      </div>
                    </li>
                  </ol>
                </div>

                <div v-if="context.recentEvents.length > 0" class="mt-5 rounded border border-border p-3">
                  <div class="mb-3 text-sm font-semibold text-foreground">最近事件</div>
                  <div class="grid gap-2 md:grid-cols-2">
                    <div
                      v-for="event in context.recentEvents"
                      :key="`${event.eventTime}-${event.nodeCode}-${event.eventType}`"
                      class="rounded bg-muted/40 p-3"
                    >
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-medium text-foreground">{{ formatEventType(event.eventType) }}</span>
                        <ElTag effect="plain" size="small">{{ formatEventStatus(event.eventStatus) }}</ElTag>
                        <span class="text-xs text-muted-foreground">{{ formatDateTime(event.eventTime) }}</span>
                      </div>
                      <div class="mt-1 text-sm text-muted-foreground">
                        {{ formatNullable(event.eventContent) }}
                      </div>
                    </div>
                  </div>
                </div>
                <ElEmpty v-if="workflowTimelineSteps.length === 0" description="当前对象暂无节点记录" />
              </ElTabPane>

              <ElTabPane label="技术任务与返工" name="work-items">
                <div class="flex flex-col gap-4">
                  <div>
                    <h4 class="mb-3 text-sm font-semibold text-foreground">技术任务</h4>
                    <ElTable :data="filteredTasks" border>
                      <ElTableColumn label="任务号" min-width="180" prop="id" />
                      <ElTableColumn label="任务类型" min-width="120">
                        <template #default="{ row }">
                          {{ formatTaskType(row.taskType) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="状态" min-width="120">
                        <template #default="{ row }">
                          <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                            {{ formatTaskStatus(row.taskStatus) }}
                          </ElTag>
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="优先级" min-width="100">
                        <template #default="{ row }">
                          {{ formatTaskPriority(row.priority) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="当前节点" min-width="120">
                        <template #default="{ row }">
                          {{ formatTaskType(row.currentNode || row.taskType) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="责任人" min-width="120">
                        <template #default="{ row }">
                          {{ formatNullable(row.assignedToName) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="对象编号" min-width="180">
                        <template #default="{ row }">
                          {{ formatNullable(row.objectId) }}
                        </template>
                      </ElTableColumn>
                      <ElTableColumn label="完成时间" min-width="180">
                        <template #default="{ row }">
                          {{ formatDateTime(row.completedAt) }}
                        </template>
                      </ElTableColumn>
                    </ElTable>
                  </div>

                  <div>
                    <h4 class="mb-3 text-sm font-semibold text-foreground">返工单</h4>
                    <ElTable :data="filteredReworks" border>
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
                      <ElTableColumn label="原因" min-width="240">
                        <template #default="{ row }">
                          {{ formatNullable(row.reason) }}
                        </template>
                      </ElTableColumn>
                    </ElTable>
                  </div>
                </div>
              </ElTabPane>

              <ElTabPane label="质控与异常" name="abnormal">
                <div class="flex flex-col gap-4">
                  <ElAlert
                    v-if="context.alerts.length > 0"
                    :closable="false"
                    :title="`当前聚焦对象有 ${context.alerts.length} 条前置提醒`"
                    type="warning"
                    show-icon
                  />
                  <ElTable :data="filteredQcEvaluations" border>
                    <ElTableColumn label="质控记录号" min-width="180" prop="qcEvaluationId" />
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
                    <ElTableColumn label="问题描述" min-width="220">
                      <template #default="{ row }">
                        {{ formatNullable(row.issueDescription) }}
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
                </div>
              </ElTabPane>
            </ElTabs>
          </WorkflowSectionCard>
        </div>

        <div class="grid gap-4 xl:grid-cols-3">
          <WorkflowSectionCard title="标本摘要" description="保留对象层级表格，便于横向核对。">
            <ElTable :data="trackingResult.specimens" border>
              <ElTableColumn label="标本号" min-width="120">
                <template #default="{ row }">
                  {{ formatNullable(row.specimenNo) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="标本名称" min-width="160">
                <template #default="{ row }">
                  {{ formatNullable(row.specimenName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" min-width="120">
                <template #default="{ row }">
                  {{ formatSpecimenStatus(row.specimenStatus) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </WorkflowSectionCard>

          <WorkflowSectionCard title="包埋与切片" description="前置查看包埋盒提示和玻片状态。">
            <ElTable :data="trackingResult.embeddingBoxes" border>
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
              <ElTableColumn label="玻片数量" min-width="100" prop="slideCount" />
            </ElTable>
          </WorkflowSectionCard>

          <WorkflowSectionCard title="玻片状态" description="用于快速判断是否已完成切片、染色和质控。">
            <ElTable :data="trackingResult.slides" border>
              <ElTableColumn label="玻片号" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.slideNo) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="玻片状态" min-width="120">
                <template #default="{ row }">
                  {{ formatSlideStatus(row.slideStatus) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="质控状态" min-width="120">
                <template #default="{ row }">
                  {{ formatQualityStatus(row.qualityStatus) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </WorkflowSectionCard>
        </div>
      </template>
    </div>
  </Page>
</template>

<style scoped>
.tracking-flow {
  padding: 18px 2px 10px;
}

.tracking-flow__list {
  --completed-color: #10b981;
  --current-color: #2563eb;
  --pending-color: #cbd5e1;
  --line-color: #dbe4f0;

  display: grid;
  grid-template-columns: repeat(var(--step-count), minmax(160px, 1fr));
  min-width: 960px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tracking-flow__item {
  position: relative;
  min-width: 0;
  padding: 0 16px 0 0;
}

.tracking-flow__item::before,
.tracking-flow__item::after {
  position: absolute;
  top: 16px;
  height: 3px;
  content: '';
}

.tracking-flow__item::before {
  right: calc(100% - 16px);
  left: -100%;
  background: var(--line-color);
}

.tracking-flow__item::after {
  right: calc(100% - 16px);
  left: -100%;
  background: var(--completed-color);
  opacity: 0;
}

.tracking-flow__item:first-child::before,
.tracking-flow__item:first-child::after {
  display: none;
}

.tracking-flow__item.is-completed::after,
.tracking-flow__item.is-current::after {
  opacity: 1;
}

.tracking-flow__marker {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  background: #ffffff;
  border: 2px solid var(--pending-color);
  border-radius: 999px;
}

.tracking-flow__item.is-completed .tracking-flow__marker {
  color: #ffffff;
  background: var(--completed-color);
  border-color: var(--completed-color);
}

.tracking-flow__item.is-current .tracking-flow__marker {
  color: #ffffff;
  background: var(--current-color);
  border-color: #bfdbfe;
  box-shadow: 0 0 0 4px #dbeafe;
}

.tracking-flow__current-dot {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 999px;
}

.tracking-flow__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tracking-flow__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: hsl(var(--foreground));
}

.tracking-flow__time,
.tracking-flow__meta,
.tracking-flow__content {
  min-height: 18px;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracking-flow__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
