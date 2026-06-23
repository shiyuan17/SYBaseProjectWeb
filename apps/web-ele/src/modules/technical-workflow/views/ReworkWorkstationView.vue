<script setup lang="ts">
import type {
  ReworkOrderResult,
  TechnicalTrackingView as TechnicalTrackingViewModel,
  TechnicalWorkflowTaskType,
} from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getTechnicalTracking } from '../api/technical-workflow-service';
import ReworkCreateDialog from '../components/ReworkCreateDialog.vue';
import ReworkExecuteDialog from '../components/ReworkExecuteDialog.vue';
import TechnicalCaseContextPanel from '../components/TechnicalCaseContextPanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { TASK_TYPE_TITLE_MAP } from '../constants';
import {
  buildDateRangeQueryParams,
  buildDateRangeRouteQuery,
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
  resolveRouteDateRange,
} from '../utils/date-range';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEvaluationResult,
  formatNullable,
  formatQcType,
  formatReworkType,
  formatTaskStatus,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import { buildWorkstationCaseContext } from '../utils/workstation';

const route = useRoute();
const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);
const dateRangeShortcuts = createDateRangePickerShortcuts();

const REWORK_NEXT_TASK_MAP: Record<string, TechnicalWorkflowTaskType> = {
  REGROSSING: 'GROSSING',
  REEMBED: 'EMBEDDING',
  RESLICE: 'SLICING',
  RESTAIN: 'STAINING',
};

const pageError = ref('');
const trackingLoading = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const createDialogVisible = ref(false);
const executeDialogVisible = ref(false);
const initialReworkOrderId = ref('');
const deepLinkedHandled = ref(false);
const nextStep = ref<null | {
  message: string;
  taskType: TechnicalWorkflowTaskType;
  title: string;
}>(null);

const queryForm = reactive({
  caseId: typeof route.query.caseId === 'string' ? route.query.caseId : '',
  dateRange: resolveRouteDateRange(route.query),
});

const resolvedCaseId = computed(
  () => trackingResult.value?.caseId?.trim() ?? '',
);

const caseContext = computed(() =>
  trackingResult.value
    ? buildWorkstationCaseContext(trackingResult.value)
    : null,
);

const sourceObjectSummary = computed(() => {
  const objectId =
    typeof route.query.objectId === 'string' ? route.query.objectId : '';
  const objectType =
    typeof route.query.objectType === 'string' ? route.query.objectType : '';
  if (!objectId && !objectType) {
    return null;
  }
  return {
    objectId,
    objectType,
    pathologyNo:
      typeof route.query.pathologyNo === 'string'
        ? route.query.pathologyNo
        : '',
  };
});

function resolveNextStep(
  reworkType?: null | string,
  message = '返工已处理，可回到对应工位继续作业。',
) {
  const taskType = reworkType ? REWORK_NEXT_TASK_MAP[reworkType] : '';
  if (!taskType) {
    nextStep.value = null;
    return;
  }
  nextStep.value = {
    message,
    taskType,
    title: TASK_TYPE_TITLE_MAP[taskType] ?? taskType,
  };
}

async function loadTracking() {
  const caseIdentifier = queryForm.caseId.trim();
  if (!caseIdentifier) {
    ElMessage.warning('请输入病例ID、病理号或对象ID');
    return;
  }

  trackingLoading.value = true;
  pageError.value = '';
  try {
    trackingResult.value = await getTechnicalTracking(caseIdentifier, {
      ...buildDateRangeQueryParams(queryForm.dateRange),
      workDate:
        queryForm.dateRange.length === 0 &&
        typeof route.query.workDate === 'string' &&
        route.query.workDate.trim()
          ? route.query.workDate
          : undefined,
    });
    if (
      !deepLinkedHandled.value &&
      (route.query.taskId ||
        route.query.objectId ||
        route.query.mode === 'exception')
    ) {
      deepLinkedHandled.value = true;
      createDialogVisible.value = true;
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingLoading.value = false;
  }
}

function openCreateDialog() {
  if (!trackingResult.value) {
    ElMessage.warning('请先加载病例追踪');
    return;
  }
  createDialogVisible.value = true;
}

function openExecuteDialog(reworkOrderId = '') {
  if (!trackingResult.value) {
    ElMessage.warning('请先加载病例追踪');
    return;
  }
  initialReworkOrderId.value = reworkOrderId;
  executeDialogVisible.value = true;
}

function goToWorkstationByReworkType(reworkType?: null | string) {
  const taskType = reworkType ? REWORK_NEXT_TASK_MAP[reworkType] : '';
  if (!taskType || !resolvedCaseId.value) {
    ElMessage.warning('当前返工类型缺少可跳转工位');
    return;
  }
  void navigation.goToTaskType(taskType, {
    caseId: resolvedCaseId.value,
    ...buildDateRangeRouteQuery(queryForm.dateRange),
    mode: 'exception',
    pathologyNo: trackingResult.value?.pathologyNo ?? undefined,
  });
}

function goToSuggestedNextStep() {
  if (!nextStep.value || !resolvedCaseId.value) {
    return;
  }
  void navigation.goToTaskType(nextStep.value.taskType, {
    caseId: resolvedCaseId.value,
    ...buildDateRangeRouteQuery(queryForm.dateRange),
    mode: 'exception',
    pathologyNo: trackingResult.value?.pathologyNo ?? undefined,
  });
}

async function handleCreateSubmitted(result: ReworkOrderResult) {
  createDialogVisible.value = false;
  resolveNextStep(result.reworkType, '返工单已创建，可直接回到对应工位处理。');
  await loadTracking();
}

async function handleExecuteSubmitted(result: ReworkOrderResult) {
  executeDialogVisible.value = false;
  resolveNextStep(
    result.reworkType,
    '返工单已执行，可继续回到目标工位完成处理。',
  );
  await loadTracking();
}

if (queryForm.caseId) {
  void loadTracking();
}
</script>

<template>
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <WorkflowSectionCard title="异常入口">
          <ElForm label-width="96px">
            <ElFormItem label="病例编号" required>
              <ElInput
                v-model="queryForm.caseId"
                clearable
                placeholder="请输入病例编号"
                @keyup.enter="loadTracking"
              />
            </ElFormItem>
            <ElFormItem label="工作日期">
              <ElDatePicker
                v-model="queryForm.dateRange"
                :default-value="createDatePickerPanelDefaultValue()"
                :disabled-date="disableFutureDate"
                :shortcuts="dateRangeShortcuts"
                end-placeholder="结束日期"
                range-separator="至"
                start-placeholder="开始日期"
                type="daterange"
                unlink-panels
                value-format="YYYY-MM-DD"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton
                :loading="trackingLoading"
                type="primary"
                @click="loadTracking"
              >
                加载病例追踪
              </ElButton>
            </ElFormItem>
          </ElForm>

          <div
            v-if="sourceObjectSummary"
            class="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
          >
            当前深链对象：{{ formatNullable(sourceObjectSummary.objectType) }} /
            {{ formatNullable(sourceObjectSummary.objectId) }}
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <ElButton
              :disabled="!trackingResult"
              type="primary"
              @click="openCreateDialog"
            >
              创建返工单
            </ElButton>
            <ElButton
              :disabled="!trackingResult?.reworks?.length"
              type="success"
              @click="openExecuteDialog()"
            >
              执行返工单
            </ElButton>
          </div>
        </WorkflowSectionCard>

        <div class="flex flex-col gap-4">
          <WorkflowSectionCard title="当前异常处理区">
            <template v-if="trackingResult">
              <ElDescriptions :column="2" border>
                <ElDescriptionsItem label="病例编号">
                  {{ formatNullable(trackingResult.caseId) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="病理号">
                  {{ formatNullable(trackingResult.pathologyNo) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="返工数">
                  {{ trackingResult.reworks.length }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="质控异常数">
                  {{ trackingResult.qcEvaluations.length }}
                </ElDescriptionsItem>
              </ElDescriptions>

              <ElAlert
                v-if="nextStep"
                class="mt-4"
                :closable="false"
                :title="`建议下一步：${nextStep.title}`"
                type="success"
                show-icon
              >
                <template #default>
                  <div
                    class="flex flex-wrap items-center justify-between gap-3"
                  >
                    <span>{{ nextStep.message }}</span>
                    <ElButton
                      plain
                      size="small"
                      type="success"
                      @click="goToSuggestedNextStep"
                    >
                      返回对应工位
                    </ElButton>
                  </div>
                </template>
              </ElAlert>
            </template>
            <div
              v-else
              class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
            >
              加载病例后，这里会固定展示返工摘要、返工列表和回流入口。
            </div>
          </WorkflowSectionCard>

          <WorkflowSectionCard v-if="trackingResult" title="返工单列表">
            <ElTable :data="trackingResult.reworks" border>
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
                  <ElTag
                    :type="
                      row.status === 'COMPLETED'
                        ? 'success'
                        : row.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'info'
                    "
                  >
                    {{ formatTaskStatus(row.status) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="原因" min-width="220">
                <template #default="{ row }">
                  {{ formatNullable(row.reason) }}
                </template>
              </ElTableColumn>
              <ElTableColumn fixed="right" label="操作" min-width="220">
                <template #default="{ row }">
                  <div class="flex items-center gap-2">
                    <ElButton
                      link
                      type="primary"
                      @click="openExecuteDialog(row.reworkOrderId)"
                    >
                      执行返工
                    </ElButton>
                    <ElButton
                      link
                      type="success"
                      @click="goToWorkstationByReworkType(row.reworkType)"
                    >
                      回到对应工位
                    </ElButton>
                  </div>
                </template>
              </ElTableColumn>
            </ElTable>
          </WorkflowSectionCard>

          <WorkflowSectionCard v-if="trackingResult" title="质控与异常记录">
            <ElTable :data="trackingResult.qcEvaluations" border>
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

        <TechnicalCaseContextPanel
          :context="caseContext"
          :loading="trackingLoading"
        />
      </div>
    </div>

    <ReworkCreateDialog
      v-model="createDialogVisible"
      :case-id="resolvedCaseId"
      :initial-object-id="
        typeof route.query.objectId === 'string' ? route.query.objectId : ''
      "
      :initial-object-type="
        typeof route.query.objectType === 'string' ? route.query.objectType : ''
      "
      :tracking-result="trackingResult"
      @submitted="handleCreateSubmitted"
    />

    <ReworkExecuteDialog
      v-model="executeDialogVisible"
      :initial-rework-order-id="initialReworkOrderId"
      :tracking-result="trackingResult"
      @submitted="handleExecuteSubmitted"
    />
  </Page>
</template>
