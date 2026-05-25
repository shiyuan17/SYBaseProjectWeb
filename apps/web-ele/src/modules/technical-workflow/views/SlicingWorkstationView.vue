<script setup lang="ts">
import type {
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
  startSlicing,
} from '../api/technical-workflow-service';
import SlicingProcessDialog from '../components/SlicingProcessDialog.vue';
import TechnicalCaseContextPanel from '../components/TechnicalCaseContextPanel.vue';
import TechnicalTaskQueuePanel from '../components/TechnicalTaskQueuePanel.vue';
import TechnicalTaskStartDialog from '../components/TechnicalTaskStartDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import WorkstationTaskFocusPanel from '../components/WorkstationTaskFocusPanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { buildWorkstationCaseContext, buildWorkstationQueueItems } from '../utils/workstation';

const route = useRoute();
const router = useRouter();

const pageError = ref('');
const loading = ref(false);
const trackingLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const total = ref(0);
const startDialogVisible = ref(false);
const processDialogVisible = ref(false);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const pendingAutoProcessTaskId = ref('');

const filters = reactive({
  page: 1,
  pathologyNo: typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: route.query.mode === 'exception',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'SLICING',
  timedOutOnly: filters.timedOutOnly,
}));

const queueItems = computed(() => buildWorkstationQueueItems(pendingItems.value, 'SLICING'));
const caseContext = computed(() =>
  trackingResult.value ? buildWorkstationCaseContext(trackingResult.value, 'SLICING') : null,
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

function selectTask(taskId: string, openProcess = false) {
  const matchedTask = pendingItems.value.find((item) => item.id === taskId) ?? null;
  if (!matchedTask) {
    return;
  }
  selectedTask.value = matchedTask;
  if (openProcess) {
    if (matchedTask.taskStatus === 'PENDING') {
      pendingAutoProcessTaskId.value = matchedTask.id;
      startDialogVisible.value = true;
      return;
    }
    processDialogVisible.value = true;
  }
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId = typeof route.query.taskId === 'string' ? route.query.taskId : '';
    const preferredTaskId =
      pendingAutoProcessTaskId.value || deepLinkedTaskId || selectedTask.value?.id || result.items[0]?.id;
    if (preferredTaskId) {
      selectTask(preferredTaskId, Boolean(pendingAutoProcessTaskId.value || deepLinkedTaskId));
    } else {
      selectedTask.value = null;
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function handleStartSubmitted() {
  startDialogVisible.value = false;
  await loadPendingData();
  if (pendingAutoProcessTaskId.value) {
    processDialogVisible.value = true;
    pendingAutoProcessTaskId.value = '';
  }
}

async function handleProcessSubmitted() {
  processDialogVisible.value = false;
  await loadPendingData();
}

function openTaskProcessing() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧队列选择任务');
    return;
  }
  selectTask(selectedTask.value.id, true);
}

watch(selectedTask, (task) => {
  void loadTrackingForTask(task);
});

void loadPendingData();
</script>

<template>
  <Page
    title="切片工作站"
    description="让包埋盒信息、切片提示和处理入口同时常驻在工位里，减少来回查找。"
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
          title="待切片任务"
          description="默认按异常、待处理和病例维度排序，优先帮助技师持续处理同类对象。"
          @select="selectTask"
        >
          <template #filters>
            <ElForm label-width="56px">
              <ElFormItem label="病理号">
                <ElInput
                  v-model="filters.pathologyNo"
                  clearable
                  placeholder="病理号/包埋盒号"
                  @keyup.enter="loadPendingData"
                />
              </ElFormItem>
            </ElForm>
          </template>
          <template #extra>
            <ElButton
              :type="filters.timedOutOnly ? 'danger' : 'default'"
              @click="filters.timedOutOnly = !filters.timedOutOnly; loadPendingData()"
            >
              {{ filters.timedOutOnly ? '仅异常' : '全部任务' }}
            </ElButton>
          </template>
        </TechnicalTaskQueuePanel>

        <WorkflowSectionCard
          title="当前处理对象"
          description="当前先统一工位交互模型，后续再继续细化同盒批量切片和结构化提醒。"
        >
          <WorkstationTaskFocusPanel
            action-title="核对蜡块、登记切片参数并生成玻片"
            :next-flow-label="caseContext?.nextFlowLabel"
            object-title="包埋盒/蜡块 + 玻片"
            reminder-title="切片提示、质量问题和重切/返工"
            :task="selectedTask"
          >
            <div class="mt-4 flex flex-wrap gap-3">
              <ElButton type="primary" @click="openTaskProcessing">
                {{ selectedTask?.taskStatus === 'PENDING' ? '开始并处理切片' : '继续处理切片' }}
              </ElButton>
              <ElButton
                @click="router.push({ path: '/technical-workflow/tracking', query: { caseId: selectedTask?.caseId ?? '' } })"
              >
                查看生产轨迹
              </ElButton>
            </div>

            <div class="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              当前先复用现有切片表单与接口，后续再把同盒批量、重切提醒和白片提示进一步前置成结构化交互。
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

        <TechnicalCaseContextPanel :context="caseContext" :loading="trackingLoading" />
      </div>
    </div>

    <TechnicalTaskStartDialog
      v-model="startDialogVisible"
      confirm-text="开始切片"
      :submit-action="(taskId, payload) => startSlicing({ ...payload, taskId })"
      :success-message="(task) => `任务 ${task.id} 已开始切片`"
      :task="selectedTask"
      terminal-placeholder="切片终端编码"
      title="开始切片"
      @submitted="handleStartSubmitted"
    />

    <SlicingProcessDialog
      v-model="processDialogVisible"
      :task="selectedTask"
      @submitted="handleProcessSubmitted"
    />
  </Page>
</template>
