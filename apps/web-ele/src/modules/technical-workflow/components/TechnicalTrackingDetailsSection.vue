<script setup lang="ts">
import type {
  ObjectProgressNode,
  TechnicalTrackingQcEvaluationSummary,
  TechnicalTrackingReworkSummary,
  TechnicalTrackingView,
  WorkstationCaseContext,
} from '../types/technical-workflow';
import type {
  TrackingTab,
  TrackingTreeNode,
  WorkflowTimelineStep,
} from '../utils/tracking';

import {
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTree,
} from 'element-plus';

import {
  formatCaseStatus,
  formatDateTime,
  formatEvaluationResult,
  formatEventStatus,
  formatEventType,
  formatNullable,
  formatObjectType,
  formatQcType,
  formatReworkType,
  formatTaskPriority,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { getTaskStatusTagType } from '../utils/tracking';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  activeTab: TrackingTab;
  context: WorkstationCaseContext;
  filteredQcEvaluations: TechnicalTrackingQcEvaluationSummary[];
  filteredReworks: TechnicalTrackingReworkSummary[];
  filteredTasks: TechnicalTrackingView['technicalTasks'];
  selectedNode: null | ObjectProgressNode;
  selectedNodeId: string;
  trackingResult: TechnicalTrackingView;
  treeData: TrackingTreeNode[];
  workflowTimelineSteps: WorkflowTimelineStep[];
}>();

const emit = defineEmits<{
  nodeClick: [data: { id: string }];
  'update:activeTab': [value: TrackingTab];
}>();

function handleActiveTabChange(value: number | string) {
  if (value === 'abnormal' || value === 'timeline' || value === 'work-items') {
    emit('update:activeTab', value);
  }
}
</script>

<template>
  <WorkflowSectionCard
    title="病例摘要"
    description="展示病例主状态和当前聚焦对象。"
  >
    <ElDescriptions :column="4" border>
      <ElDescriptionsItem label="病例编号">
        {{ trackingResult.caseId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="病理号">
        {{ formatNullable(trackingResult.pathologyNo) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="病例状态">
        {{ formatCaseStatus(trackingResult.caseStatus) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="当前聚焦对象">
        {{
          selectedNode
            ? `${selectedNode.label} / ${formatObjectType(selectedNode.type)}`
            : '病例'
        }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </WorkflowSectionCard>

  <div class="grid gap-4 xl:grid-cols-[300px_1fr]">
    <WorkflowSectionCard
      title="对象树"
      description="按照病例、标本、蜡块、包埋盒、玻片展开。"
    >
      <ElTree
        v-if="treeData.length > 0"
        :current-node-key="selectedNodeId"
        :data="treeData"
        default-expand-all
        highlight-current
        node-key="id"
        @node-click="emit('nodeClick', $event)"
      >
        <template #default="{ data }">
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm text-foreground">{{
              data.label
            }}</span>
            <ElTag v-if="data.status" effect="plain" size="small">
              {{ formatTaskStatus(data.status) }}
            </ElTag>
          </div>
        </template>
      </ElTree>
      <ElEmpty v-else description="当前病例还没有可追踪对象" />
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="追踪详情"
      description="按时间线、任务返工和质控异常查看当前对象。"
    >
      <ElTabs
        :model-value="activeTab"
        @update:model-value="handleActiveTabChange"
      >
        <ElTabPane label="流程时间线" name="timeline">
          <div
            v-if="workflowTimelineSteps.length > 0"
            class="tracking-flow overflow-x-auto"
          >
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
                  <span
                    v-else-if="step.status === 'current'"
                    class="tracking-flow__current-dot"
                  ></span>
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
                      :type="
                        step.status === 'completed'
                          ? 'success'
                          : step.status === 'current'
                            ? 'primary'
                            : 'info'
                      "
                    >
                      {{ step.statusText }}
                    </ElTag>
                    <span>{{ step.operatorName }}</span>
                  </div>
                  <div class="tracking-flow__content">
                    {{ step.content }}
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div
            v-if="context.recentEvents.length > 0"
            class="mt-5 rounded border border-border p-3"
          >
            <div class="mb-3 text-sm font-semibold text-foreground">
              最近事件
            </div>
            <div class="grid gap-2 md:grid-cols-2">
              <div
                v-for="event in context.recentEvents"
                :key="`${event.eventTime}-${event.nodeCode}-${event.eventType}`"
                class="rounded bg-muted/40 p-3"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-foreground">
                    {{ formatEventType(event.eventType) }}
                  </span>
                  <ElTag effect="plain" size="small">
                    {{ formatEventStatus(event.eventStatus) }}
                  </ElTag>
                  <span class="text-xs text-muted-foreground">
                    {{ formatDateTime(event.eventTime) }}
                  </span>
                </div>
                <div class="mt-1 text-sm text-muted-foreground">
                  {{ formatNullable(event.eventContent) }}
                </div>
              </div>
            </div>
          </div>
          <ElEmpty
            v-if="workflowTimelineSteps.length === 0"
            description="当前对象暂无节点记录"
          />
        </ElTabPane>

        <ElTabPane label="技术任务与返工" name="work-items">
          <div class="flex flex-col gap-4">
            <div>
              <h4 class="mb-3 text-sm font-semibold text-foreground">
                技术任务
              </h4>
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
                <ElTableColumn
                  label="返工单号"
                  min-width="180"
                  prop="reworkOrderId"
                />
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
              :title="`当前聚焦对象有 ${context.alerts.length} 条提醒`"
              type="warning"
              show-icon
            />
            <ElTable :data="filteredQcEvaluations" border>
              <ElTableColumn
                label="质控记录号"
                min-width="180"
                prop="qcEvaluationId"
              />
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
  background: #fff;
  border: 2px solid var(--pending-color);
  border-radius: 999px;
}

.tracking-flow__item.is-completed .tracking-flow__marker {
  color: #fff;
  background: var(--completed-color);
  border-color: var(--completed-color);
}

.tracking-flow__item.is-current .tracking-flow__marker {
  color: #fff;
  background: var(--current-color);
  border-color: #bfdbfe;
  box-shadow: 0 0 0 4px #dbeafe;
}

.tracking-flow__current-dot {
  width: 8px;
  height: 8px;
  background: #fff;
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
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.tracking-flow__meta {
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>
