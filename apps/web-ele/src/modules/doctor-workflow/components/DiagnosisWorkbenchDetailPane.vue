<script setup lang="ts">
import type {
  DiagnosticTaskActionRequest,
  DiagnosticWorkbenchView,
  MedicalOrderSummary,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import { computed } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
} from 'element-plus';

import { formatNullable, formatReportStatus } from '../utils/format';
import {
  buildDiagnosticProgressNodes,
  getDiagnosisTaskStatusTagType,
} from '../utils/workbench-view';
import DiagnosisWorkbenchTabs from './DiagnosisWorkbenchTabs.vue';

const props = defineProps<{
  actionForm: DiagnosticTaskActionRequest;
  canAccept: boolean;
  canAcceptSelectedTask: boolean;
  canCancelMedicalOrder: boolean;
  canCreateMedicalOrder: boolean;
  canOpenMedicalOrders: boolean;
  canOpenReport: boolean;
  canStart: boolean;
  canStartSelectedTask: boolean;
  loading: boolean;
  operating: boolean;
  orderOperating: boolean;
  selectedTask: null | PendingDiagnosticTaskItem;
  selectedTaskAssigneeLabel: string;
  taskActionHint: string;
  workbench: DiagnosticWorkbenchView | null;
}>();

const emit = defineEmits<{
  accept: [];
  cancelMedicalOrder: [order: MedicalOrderSummary];
  openMedicalOrderDialog: [];
  openMedicalOrders: [];
  openReport: [];
  start: [];
  'update:operator-name': [value: string];
  'update:remarks': [value: string];
  'update:terminal-code': [value: string];
}>();

const operatorNameModel = computed({
  get: () => props.actionForm.operatorName,
  set: (value: string) => emit('update:operator-name', value),
});

const remarksModel = computed({
  get: () => props.actionForm.remarks ?? '',
  set: (value: string) => emit('update:remarks', value),
});

const terminalCodeModel = computed({
  get: () => props.actionForm.terminalCode ?? '',
  set: (value: string) => emit('update:terminal-code', value),
});

const progressNodes = computed(() =>
  buildDiagnosticProgressNodes(props.workbench, props.selectedTask),
);
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <section
      class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
    >
      <div
        class="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between"
      >
        <div>
          <h3 class="text-base font-semibold text-foreground">病例上下文</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            当前病例、报告状态与诊断操作集中在同一区域，减少医生切换视线。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElTag
            v-if="selectedTask"
            :type="getDiagnosisTaskStatusTagType(selectedTask.taskStatus)"
            size="small"
          >
            当前任务 {{ formatNullable(selectedTask.id) }}
          </ElTag>
          <ElTag v-if="selectedTask" effect="plain" size="small" type="info">
            责任/初诊 {{ selectedTaskAssigneeLabel || '未分派' }}
          </ElTag>
          <ElTag
            v-if="workbench"
            :type="workbench.hasPendingRevision ? 'warning' : 'info'"
            effect="plain"
            size="small"
          >
            {{ workbench.hasPendingRevision ? '存在待修订' : '无待修订' }}
          </ElTag>
        </div>
      </div>

      <ElEmpty
        v-if="!workbench && !loading"
        class="py-10"
        description="左侧暂无可展示的病例，请先调整筛选条件。"
      />

      <div
        v-else-if="workbench"
        class="mt-3 grid gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]"
      >
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(workbench.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(workbench.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者">
            {{ formatNullable(workbench.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(workbench.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(workbench.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告状态">
            {{ formatReportStatus(workbench.currentReport?.reportStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="临床诊断">
            <div class="line-clamp-2 whitespace-pre-wrap">
              {{ formatNullable(workbench.clinicalDiagnosis) }}
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="当前最终诊断">
            <div class="line-clamp-2 whitespace-pre-wrap font-medium">
              {{ formatNullable(workbench.currentReport?.finalDiagnosis) }}
            </div>
          </ElDescriptionsItem>
        </ElDescriptions>

        <div
          class="rounded-md border border-border bg-background px-3 py-3"
          data-testid="diagnosis-workbench-actions"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold text-foreground">快捷操作</h4>
              <p class="mt-1 text-xs text-muted-foreground">
                权限与阻断规则沿用现有诊断流程。
              </p>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <ElButton
                v-if="canCreateMedicalOrder"
                size="small"
                type="primary"
                @click="emit('openMedicalOrderDialog')"
              >
                新增医嘱
              </ElButton>
              <ElButton
                v-if="canOpenMedicalOrders"
                size="small"
                type="warning"
                @click="emit('openMedicalOrders')"
              >
                医嘱工作台
              </ElButton>
            </div>
          </div>

          <ElForm class="mt-3 grid gap-2" label-position="top">
            <div class="grid gap-2 md:grid-cols-2">
              <ElFormItem class="mb-0" label="操作人">
                <ElInput
                  v-model="operatorNameModel"
                  placeholder="请输入操作人姓名"
                  size="small"
                />
              </ElFormItem>
              <ElFormItem class="mb-0" label="终端">
                <ElInput
                  v-model="terminalCodeModel"
                  placeholder="终端编码"
                  size="small"
                />
              </ElFormItem>
            </div>
            <ElFormItem class="mb-0" label="备注">
              <ElInput
                v-model="remarksModel"
                placeholder="接单或开始诊断时的备注"
                size="small"
              />
            </ElFormItem>
            <ElFormItem class="mb-0" label="诊断动作">
              <div class="flex flex-wrap gap-2">
                <ElButton
                  v-if="canAccept"
                  :disabled="!canAcceptSelectedTask"
                  :loading="operating"
                  size="small"
                  type="primary"
                  @click="emit('accept')"
                >
                  接单
                </ElButton>
                <ElButton
                  v-if="canStart"
                  :disabled="!canStartSelectedTask"
                  :loading="operating"
                  size="small"
                  type="success"
                  @click="emit('start')"
                >
                  开始诊断
                </ElButton>
                <ElButton
                  v-if="canOpenReport"
                  size="small"
                  type="info"
                  @click="emit('openReport')"
                >
                  报告编辑
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </div>
      </div>

      <ElAlert
        v-if="taskActionHint"
        :closable="false"
        :title="taskActionHint"
        class="mt-3"
        show-icon
        type="warning"
      />

      <div
        v-if="progressNodes.length > 0"
        class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4"
      >
        <article
          v-for="node in progressNodes"
          :key="node.id"
          class="rounded-md border border-border bg-background px-3 py-2"
          :class="{
            'border-warning/60 bg-warning/5': node.state === 'warning',
            'border-primary/50 bg-primary/5': node.state === 'active',
          }"
        >
          <div class="text-xs text-muted-foreground">{{ node.label }}</div>
          <div class="mt-1 text-sm font-semibold text-foreground">
            {{
              node.state === 'done'
                ? '已到达'
                : node.state === 'active'
                  ? '处理中'
                  : node.state === 'warning'
                    ? '需关注'
                    : '待进入'
            }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ node.description }}
          </div>
        </article>
      </div>
    </section>

    <DiagnosisWorkbenchTabs :workbench="workbench" />

    <section
      v-if="workbench?.medicalOrders.length"
      class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-foreground">待处理医嘱摘要</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            仍保留当前工作站内直接取消待处理医嘱的快捷入口。
          </p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="order in workbench.medicalOrders"
          :key="order.orderId"
          class="flex min-w-[240px] items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
        >
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-foreground">
              {{ formatNullable(order.orderNumber) }}
            </div>
            <div class="truncate text-xs text-muted-foreground">
              {{ formatNullable(order.orderContent) }}
            </div>
          </div>
          <ElButton
            v-if="canCancelMedicalOrder"
            :disabled="order.status !== 'PENDING'"
            :loading="orderOperating"
            size="small"
            type="danger"
            @click="emit('cancelMedicalOrder', order)"
          >
            取消
          </ElButton>
        </div>
      </div>
    </section>
  </div>
</template>
