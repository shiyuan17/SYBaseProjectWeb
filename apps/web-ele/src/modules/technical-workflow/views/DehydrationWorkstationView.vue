<script setup lang="ts">
import type {
  DehydrationBatchResult,
  PendingTechnicalTaskItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
} from 'element-plus';

import {
  getTechnicalTracking,
  listPendingTechnicalTasks,
} from '../api/technical-workflow-service';
import DehydrationBatchOperationDialog from '../components/DehydrationBatchOperationDialog.vue';
import DehydrationCreateBatchDialog from '../components/DehydrationCreateBatchDialog.vue';
import TechnicalCaseContextPanel from '../components/TechnicalCaseContextPanel.vue';
import TechnicalTaskQueuePanel from '../components/TechnicalTaskQueuePanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import WorkstationTaskFocusPanel from '../components/WorkstationTaskFocusPanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatBatchStatus } from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import {
  buildWorkstationCaseContext,
  buildWorkstationQueueItems,
} from '../utils/workstation';

const route = useRoute();
const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const pageError = ref('');
const loading = ref(false);
const trackingLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const total = ref(0);
const createDialogVisible = ref(false);
const batchDialogVisible = ref(false);
const initialBatchId = ref('');
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const latestBatchResult = ref<DehydrationBatchResult | null>(null);
const pendingAutoCreateTaskId = ref('');

const filters = reactive({
  page: 1,
  pathologyNo:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: route.query.mode === 'exception',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'DEHYDRATION',
  timedOutOnly: filters.timedOutOnly,
}));

const queueItems = computed(() =>
  buildWorkstationQueueItems(pendingItems.value, 'DEHYDRATION'),
);
const caseContext = computed(() =>
  trackingResult.value
    ? buildWorkstationCaseContext(trackingResult.value, 'DEHYDRATION')
    : null,
);

async function loadTrackingForTask(task: null | PendingTechnicalTaskItem) {
  if (!task?.caseId) {
    trackingResult.value = null;
    return;
  }
  trackingLoading.value = true;
  try {
    trackingResult.value = await getTechnicalTracking(task.caseId);
  } catch (error) {
    trackingResult.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    trackingLoading.value = false;
  }
}

function selectTask(taskId: string, openCreate = false) {
  const matchedTask =
    pendingItems.value.find((item) => item.id === taskId) ?? null;
  if (!matchedTask) {
    return;
  }
  selectedTask.value = matchedTask;
  if (openCreate) {
    pendingAutoCreateTaskId.value = matchedTask.id;
    createDialogVisible.value = true;
  }
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId =
      typeof route.query.taskId === 'string' ? route.query.taskId : '';
    const preferredTaskId =
      pendingAutoCreateTaskId.value ||
      deepLinkedTaskId ||
      selectedTask.value?.id ||
      result.items[0]?.id;
    if (preferredTaskId) {
      selectTask(
        preferredTaskId,
        Boolean(pendingAutoCreateTaskId.value || deepLinkedTaskId),
      );
    } else {
      selectedTask.value = null;
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧队列选择任务');
    return;
  }
  selectTask(selectedTask.value.id, true);
}

function openBatchOperationDialog(batchId = initialBatchId.value) {
  initialBatchId.value = batchId;
  batchDialogVisible.value = true;
}

async function handleBatchCreated(result: DehydrationBatchResult) {
  createDialogVisible.value = false;
  latestBatchResult.value = result;
  initialBatchId.value = result.batchId;
  pendingAutoCreateTaskId.value = '';
  await loadPendingData();
  batchDialogVisible.value = true;
}

async function handleBatchOperationSubmitted(result: DehydrationBatchResult) {
  batchDialogVisible.value = false;
  latestBatchResult.value = result;
  initialBatchId.value = result.batchId;
  await loadPendingData();
}

watch(selectedTask, (task) => {
  void loadTrackingForTask(task);
});

void loadPendingData();
</script>

<template>
  <Page
    title="脱水工作站"
    description="把待脱水对象、当前批次操作和病例概览放回同一屏里，减少对象维度与批次维度来回切换。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <TechnicalTaskQueuePanel
          :items="queueItems"
          :loading="loading"
          :selected-task-id="selectedTask?.id ?? ''"
          title="待脱水任务"
          description="默认按异常、待处理和病例维度排序，优先让同一病例蜡块批量入筐。"
          @select="selectTask"
        >
          <template #filters>
            <ElForm label-width="56px">
              <ElFormItem label="病理号">
                <ElInput
                  v-model="filters.pathologyNo"
                  clearable
                  placeholder="病理号 / 蜡块号"
                  @keyup.enter="loadPendingData"
                />
              </ElFormItem>
            </ElForm>
          </template>
          <template #extra>
            <ElButton
              :type="filters.timedOutOnly ? 'danger' : 'default'"
              @click="
                filters.timedOutOnly = !filters.timedOutOnly;
                loadPendingData();
              "
            >
              {{ filters.timedOutOnly ? '仅异常' : '全部任务' }}
            </ElButton>
          </template>
        </TechnicalTaskQueuePanel>

        <WorkflowSectionCard
          title="当前批次操作区"
          description="当前先保留稳定弹窗能力，但入口统一收敛到批次工作站中区。"
        >
          <WorkstationTaskFocusPanel
            action-title="创建脱水批次、对象入筐并完成批次"
            :next-flow-label="caseContext?.nextFlowLabel"
            object-title="脱水批次 + 脱水筐 + 待处理取材块"
            reminder-title="批次状态、对象数量和异常登记"
            :task="selectedTask"
          >
            <div class="mt-4 flex flex-wrap gap-3">
              <ElButton type="primary" @click="openCreateDialog">
                创建当前批次
              </ElButton>
              <ElButton @click="openBatchOperationDialog()">
                开始 / 完成批次
              </ElButton>
              <ElButton
                @click="
                  navigation.goToTracking({
                    caseId: selectedTask?.caseId ?? undefined,
                  })
                "
              >
                查看生产轨迹
              </ElButton>
            </div>

            <ElAlert
              v-if="latestBatchResult"
              class="mt-4"
              :closable="false"
              :title="`当前批次：${latestBatchResult.batchNo} / ${formatBatchStatus(latestBatchResult.batchStatus)}`"
              type="success"
              show-icon
            >
              <template #default>
                本批次已关联
                {{ latestBatchResult.taskCount }}
                个对象，可继续开始脱水或在完成后补充附件占位。
              </template>
            </ElAlert>

            <div
              class="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
            >
              一期先把“待脱水对象”与“当前批次”放回同一视图，后续可继续补扫码连续入筐、同病例一键全选和真实批次看板。
            </div>
          </WorkstationTaskFocusPanel>

          <div class="mt-4 flex justify-end">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @change="loadPendingData"
            />
          </div>
        </WorkflowSectionCard>

        <TechnicalCaseContextPanel
          :context="caseContext"
          :loading="trackingLoading"
        />
      </div>
    </div>

    <DehydrationCreateBatchDialog
      v-model="createDialogVisible"
      :task="selectedTask"
      @created="handleBatchCreated"
    />

    <DehydrationBatchOperationDialog
      v-model="batchDialogVisible"
      :initial-batch-id="initialBatchId"
      @submitted="handleBatchOperationSubmitted"
    />
  </Page>
</template>
