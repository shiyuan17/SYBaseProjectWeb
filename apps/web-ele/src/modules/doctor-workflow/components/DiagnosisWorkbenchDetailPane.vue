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

import {
  formatNullable,
  formatReportStatus,
} from '../utils/format';
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
    <section class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div
        class="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-start xl:justify-between"
      >
        <div>
          <h3 class="text-base font-semibold text-foreground">病例摘要</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            工作台右侧始终围绕当前选中的病例，汇总诊断所需的关键信息与动作入口。
          </p>
        </div>

        <div v-if="selectedTask" class="flex flex-wrap gap-2">
          <ElTag
            :type="getDiagnosisTaskStatusTagType(selectedTask.taskStatus)"
            size="small"
          >
            当前任务 {{ formatNullable(selectedTask.id) }}
          </ElTag>
          <ElTag effect="plain" size="small" type="info">
            责任/初诊 {{ selectedTaskAssigneeLabel || '未分派' }}
          </ElTag>
        </div>
      </div>

      <ElEmpty
        v-if="!workbench && !loading"
        class="py-10"
        description="左侧暂无可展示的病例，请先调整筛选条件。"
      />

      <ElDescriptions
        v-else-if="workbench"
        :column="3"
        border
        class="mt-3"
        size="small"
      >
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
        <ElDescriptionsItem label="送检医生">
          {{ formatNullable(workbench.submittingDoctorName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病例状态">
          {{ formatNullable(workbench.caseStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="报告状态">
          {{ formatReportStatus(workbench.currentReport?.reportStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="待修订">
          <ElTag :type="workbench.hasPendingRevision ? 'warning' : 'info'">
            {{ workbench.hasPendingRevision ? '是' : '否' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="3" label="临床诊断">
          {{ formatNullable(workbench.clinicalDiagnosis) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="3" label="当前最终诊断">
          {{ formatNullable(workbench.currentReport?.finalDiagnosis) }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </section>

    <section class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div
        class="flex flex-col gap-3 border-b border-border pb-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div>
          <h3 class="text-sm font-semibold text-foreground">任务操作</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            接单、开始诊断和报告入口继续沿用现有权限和阻断规则。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElButton
            v-if="canCreateMedicalOrder"
            type="primary"
            @click="emit('openMedicalOrderDialog')"
          >
            新增医嘱
          </ElButton>
          <ElButton
            v-if="canOpenMedicalOrders"
            type="warning"
            @click="emit('openMedicalOrders')"
          >
            进入医嘱工作台
          </ElButton>
        </div>
      </div>

      <ElForm
        class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_180px_minmax(220px,1fr)_auto]"
        label-position="top"
      >
        <ElFormItem class="mb-0" label="操作人">
          <ElInput
            v-model="operatorNameModel"
            placeholder="请输入操作人姓名"
          />
        </ElFormItem>
        <ElFormItem class="mb-0" label="终端">
          <ElInput v-model="terminalCodeModel" placeholder="终端编码" />
        </ElFormItem>
        <ElFormItem class="mb-0" label="备注">
          <ElInput v-model="remarksModel" placeholder="接单或开始诊断时的备注" />
        </ElFormItem>
        <ElFormItem class="mb-0" label="快捷操作">
          <div class="flex flex-wrap gap-2">
            <ElButton
              v-if="canAccept"
              :disabled="!canAcceptSelectedTask"
              :loading="operating"
              type="primary"
              @click="emit('accept')"
            >
              接单
            </ElButton>
            <ElButton
              v-if="canStart"
              :disabled="!canStartSelectedTask"
              :loading="operating"
              type="success"
              @click="emit('start')"
            >
              开始诊断
            </ElButton>
            <ElButton v-if="canOpenReport" type="info" @click="emit('openReport')">
              报告编辑
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>

      <ElAlert
        v-if="taskActionHint"
        :closable="false"
        :title="taskActionHint"
        class="mt-3"
        show-icon
        type="warning"
      />

      <div class="mt-4 grid gap-3 xl:grid-cols-4">
        <article
          v-for="node in progressNodes"
          :key="node.id"
          class="rounded-md border border-border bg-background px-3 py-3"
          :class="{
            'border-warning/60 bg-warning/5': node.state === 'warning',
            'border-primary/50 bg-primary/5': node.state === 'active',
          }"
        >
          <div class="text-xs text-muted-foreground">{{ node.label }}</div>
          <div class="mt-2 text-sm font-semibold text-foreground">
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
