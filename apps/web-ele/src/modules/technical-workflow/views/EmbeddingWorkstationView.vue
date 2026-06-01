<script setup lang="ts">
import type {
  EmbeddingWorkstationSummary,
  PendingTechnicalTaskItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDrawer,
  ElEmpty,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import {
  completeEmbedding,
  getEmbeddingWorkstationSummary,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startEmbedding,
} from '../api/technical-workflow-service';
import EmbeddingWorkstationProcessPanel from '../components/EmbeddingWorkstationProcessPanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

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
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';

interface EvaluationDrawerRow {
  category: string;
  description: string;
  operator: string;
  status: string;
  time: null | string;
  title: string;
}

function createEmptySummary(): EmbeddingWorkstationSummary {
  return {
    completedCount: 0,
    completedRecords: [],
    pendingCount: 0,
    pendingTasks: [],
    workDate: null,
  };
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const navigation = useTechnicalWorkflowNavigation(router);

const pageError = ref('');
const loading = ref(false);
const summaryLoading = ref(false);
const trackingLoading = ref(false);
const startLoading = ref(false);
const completeLoading = ref(false);

const workstationSummary = ref<EmbeddingWorkstationSummary>(createEmptySummary());
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const total = ref(0);

const selectedTaskId = ref(
  typeof route.query.taskId === 'string' ? route.query.taskId : '',
);
const deepLinkedTaskId = ref(selectedTaskId.value);
const activeProcessingTaskId = ref('');

const historyDrawerVisible = ref(false);
const evaluationDrawerVisible = ref(false);
const taskDrawerVisible = ref(false);

const filters = reactive({
  keyword:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const operatorForm = reactive(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

const completeForm = reactive({
  blockCount: 1,
  deviceCode: '',
  embeddingBoxNo: '',
  evaluationLevel: '',
  samplingBlockId: '',
  samplingEvaluation: '',
  sliceNotice: '',
});

const selectedTask = computed(
  () => pendingItems.value.find((item) => item.id === selectedTaskId.value) ?? null,
);

const selectedBlock = computed(() => {
  if (!selectedTask.value || !trackingResult.value) {
    return null;
  }
  const blockId =
    selectedTask.value.objectType === 'SAMPLING_BLOCK'
      ? selectedTask.value.objectId
      : null;
  const matchedBlock =
    trackingResult.value.blocks.find((item) => item.blockId === blockId) ??
    trackingResult.value.blocks.find(
      (item) => item.blockCode === selectedTask.value?.samplingBlockCode,
    );
  if (!matchedBlock) {
    return null;
  }
  return {
    blockCode: matchedBlock.blockCode ?? null,
    blockDescription: matchedBlock.description ?? null,
    grossDescription: matchedBlock.grossDescription ?? null,
    specimenName: matchedBlock.specimenName ?? null,
  };
});

const currentCaseEmbeddingRecords = computed(
  () => trackingResult.value?.embeddingRecords ?? [],
);

const evaluationDrawerRows = computed<EvaluationDrawerRow[]>(() => {
  if (!trackingResult.value) {
    return [];
  }

  const rows: EvaluationDrawerRow[] = [];

  (trackingResult.value.embeddingEvaluationRecords ?? []).forEach((item) => {
    rows.push({
      category: '包埋评价',
      description: [
        `取材评价：${formatNullable(item.samplingEvaluation)}`,
        `包埋备注：${formatNullable(item.embeddingRemarks)}`,
      ].join(' / '),
      operator: formatNullable(item.embeddedByName),
      status: formatNullable(item.evaluationLevel),
      time: item.endedAt,
      title: `${formatNullable(item.samplingBlockCode)} / ${formatNullable(item.specimenName)}`,
    });
  });

  trackingResult.value.qcEvaluations.forEach((item) => {
    rows.push({
      category: '质控记录',
      description: [
        `质控类型：${formatQcType(item.qcType)}`,
        `问题：${formatNullable(item.issueDescription)}`,
        `建议：${formatNullable(item.improvementSuggestion)}`,
      ].join(' / '),
      operator: formatNullable(item.evaluatorName),
      status: formatEvaluationResult(item.evaluationResult),
      time: item.evaluatedAt,
      title: formatNullable(item.slideNo),
    });
  });

  trackingResult.value.reworks.forEach((item) => {
    rows.push({
      category: '返工记录',
      description: `返工原因：${formatNullable(item.reason)}`,
      operator: '-',
      status: formatTaskStatus(item.status),
      time: null,
      title: formatReworkType(item.reworkType),
    });
  });

  return rows.sort((left, right) => {
    const leftTime = left.time ? new Date(left.time).getTime() : 0;
    const rightTime = right.time ? new Date(right.time).getTime() : 0;
    return rightTime - leftTime;
  });
});

const canCompleteCurrentTask = computed(
  () =>
    Boolean(
      selectedTask.value &&
        activeProcessingTaskId.value === selectedTask.value.id &&
        completeForm.samplingBlockId.trim(),
    ),
);

function resetCompleteForm(task: null | PendingTechnicalTaskItem) {
  completeForm.blockCount = 1;
  completeForm.deviceCode = '';
  completeForm.embeddingBoxNo = '';
  completeForm.evaluationLevel = '';
  completeForm.samplingBlockId =
    task?.objectType === 'SAMPLING_BLOCK' ? (task.objectId ?? '') : '';
  completeForm.samplingEvaluation = '';
  completeForm.sliceNotice = '';
}

function resetOperatorForm() {
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
}

function resetPanelState(task: null | PendingTechnicalTaskItem) {
  resetOperatorForm();
  resetCompleteForm(task);
}

function clearCurrentSelection() {
  selectedTaskId.value = '';
  activeProcessingTaskId.value = '';
  trackingResult.value = null;
  resetPanelState(null);
}

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
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingLoading.value = false;
  }
}

function resolvePreferredTaskId(
  items: PendingTechnicalTaskItem[],
  preferredTaskId?: string,
) {
  const candidates = [
    preferredTaskId,
    deepLinkedTaskId.value,
    selectedTaskId.value,
  ].filter((item): item is string => Boolean(item));
  for (const candidate of candidates) {
    if (items.some((item) => item.id === candidate)) {
      return candidate;
    }
  }
  return items[0]?.id ?? '';
}

async function loadSummary() {
  summaryLoading.value = true;
  try {
    workstationSummary.value = await getEmbeddingWorkstationSummary();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    summaryLoading.value = false;
  }
}

async function loadPendingData(preferredTaskId?: string) {
  loading.value = true;
  try {
    const result = await listPendingTechnicalTasks({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      size: filters.size,
      taskType: 'EMBEDDING',
    });
    pendingItems.value = result.items;
    total.value = result.total;

    const nextTaskId = resolvePreferredTaskId(result.items, preferredTaskId);
    deepLinkedTaskId.value = '';

    if (!nextTaskId) {
      clearCurrentSelection();
      return;
    }

    if (selectedTaskId.value !== nextTaskId) {
      selectedTaskId.value = nextTaskId;
      return;
    }

    if (selectedTask.value) {
      await loadTrackingForTask(selectedTask.value);
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

async function refreshWorkstation(preferredTaskId?: string) {
  await Promise.all([loadSummary(), loadPendingData(preferredTaskId)]);
}

function selectTask(taskId: string) {
  if (taskId === selectedTaskId.value) {
    return;
  }
  selectedTaskId.value = taskId;
}

async function handleSearch() {
  filters.page = 1;
  await loadPendingData();
}

async function handleStartEmbedding() {
  const task = selectedTask.value;
  if (!task) {
    ElMessage.warning('请先选择待包埋任务');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (task.taskStatus !== 'PENDING') {
    activeProcessingTaskId.value = task.id;
    return;
  }

  startLoading.value = true;
  try {
    await startEmbedding({
      ...normalizeTechnicalOperatorPayload(operatorForm),
      taskId: task.id,
    });
    ElMessage.success(`任务 ${task.id} 已开始包埋`);
    activeProcessingTaskId.value = task.id;
    await refreshWorkstation(task.id);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    startLoading.value = false;
  }
}

async function handleCompleteEmbedding() {
  const task = selectedTask.value;
  if (!task) {
    ElMessage.warning('请先选择待包埋任务');
    return;
  }
  if (activeProcessingTaskId.value !== task.id) {
    ElMessage.warning('请先点击“确认包埋”进入当前处理态');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (!completeForm.samplingBlockId.trim()) {
    ElMessage.warning('当前缺少取材块编号');
    return;
  }

  completeLoading.value = true;
  try {
    const result = await completeEmbedding({
      ...normalizeTechnicalOperatorPayload(operatorForm),
      blockCount: completeForm.blockCount,
      deviceCode: completeForm.deviceCode.trim() || null,
      embeddingBoxNo: completeForm.embeddingBoxNo.trim() || null,
      evaluationLevel: completeForm.evaluationLevel || null,
      samplingBlockId: completeForm.samplingBlockId.trim(),
      samplingEvaluation: completeForm.samplingEvaluation.trim() || null,
      sliceNotice: completeForm.sliceNotice.trim() || null,
      taskId: task.id,
    });
    ElMessage.success(
      result.markingSuccess
        ? `包埋完成，包埋盒 ${result.embeddingBoxId} 打号成功`
        : `包埋完成，打号结果：${formatNullable(result.markingMessage)}`,
    );
    activeProcessingTaskId.value = '';
    await refreshWorkstation();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    completeLoading.value = false;
  }
}

function handleCancelEmbedding() {
  activeProcessingTaskId.value = '';
  resetPanelState(selectedTask.value);
}

function handleClearCurrent() {
  clearCurrentSelection();
}

function handleMore() {
  if (!selectedTask.value) {
    ElMessage.warning('请先选择任务后再查看更多信息');
    return;
  }
  void navigation.goToTracking({
    caseId: selectedTask.value.caseId,
    pathologyNo: selectedTask.value.pathologyNo ?? undefined,
    taskId: selectedTask.value.id,
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'F9') {
    return;
  }
  event.preventDefault();
  if (canCompleteCurrentTask.value && !completeLoading.value) {
    void handleCompleteEmbedding();
  }
}

watch(selectedTaskId, async () => {
  const task = selectedTask.value;
  activeProcessingTaskId.value = task?.taskStatus === 'IN_PROGRESS' ? task.id : '';
  resetPanelState(task);
  await loadTrackingForTask(task);
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  void refreshWorkstation(selectedTaskId.value || undefined);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        title="包埋工作站加载失败"
        type="error"
      >
        <template #default>{{ pageError }}</template>
      </ElAlert>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div class="grid gap-4 sm:grid-cols-2">
          <article class="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div class="text-sm text-slate-500">待包埋数</div>
            <div class="mt-2 text-3xl font-semibold text-slate-900">
              {{ summaryLoading ? '--' : workstationSummary.pendingCount }}
            </div>
            <div class="mt-2 text-xs text-slate-400">
              统计范围：{{ workstationSummary.workDate || '服务端当日' }}
            </div>
          </article>
          <article class="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div class="text-sm text-slate-500">已包埋数</div>
            <div class="mt-2 text-3xl font-semibold text-emerald-600">
              {{ summaryLoading ? '--' : workstationSummary.completedCount }}
            </div>
            <div class="mt-2 text-xs text-slate-400">
              当日已完成记录实时汇总
            </div>
          </article>
        </div>

        <div class="flex flex-wrap items-start justify-end gap-3">
          <ElButton
            :disabled="!selectedTask"
            @click="historyDrawerVisible = true"
          >
            包埋历史
          </ElButton>
          <ElButton
            :disabled="!selectedTask"
            @click="evaluationDrawerVisible = true"
          >
            评价记录
          </ElButton>
        </div>
      </section>

      <section class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <ElButton
          :disabled="!selectedTask"
          :loading="startLoading"
          type="primary"
          @click="handleStartEmbedding"
        >
          确认包埋
        </ElButton>
        <ElInput
          v-model="filters.keyword"
          class="max-w-[280px]"
          clearable
          placeholder="病人ID/病理号"
          @keyup.enter="handleSearch"
        />
        <ElButton @click="handleSearch">查询</ElButton>
        <ElButton @click="handleMore">更多</ElButton>
        <ElButton @click="handleClearCurrent">确认清零</ElButton>
        <ElButton @click="taskDrawerVisible = true">包埋任务</ElButton>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <article class="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">待包埋列表</h2>
              <p class="mt-1 text-sm text-slate-500">
                按病理号和病人ID筛选当前待处理包埋任务。
              </p>
            </div>
            <div class="text-sm text-slate-500">共 {{ total }} 条</div>
          </div>

          <div class="overflow-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">备注</th>
                  <th class="px-4 py-3">取材操作</th>
                  <th class="px-4 py-3">主班备注</th>
                  <th class="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody v-if="pendingItems.length">
                <tr
                  v-for="item in pendingItems"
                  :key="item.id"
                  :class="
                    item.id === selectedTaskId
                      ? 'bg-sky-50'
                      : 'hover:bg-slate-50'
                  "
                  class="cursor-pointer border-t border-slate-100 text-slate-700"
                  @click="selectTask(item.id)"
                >
                  <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.samplingBlockCode) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.remarks) }}</td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.sampledByName) }} /
                    {{ formatDateTime(item.sampledAt) }}
                  </td>
                  <td class="px-4 py-3">{{ formatNullable(item.productionRemarks) }}</td>
                  <td class="px-4 py-3">
                    <ElTag :type="item.taskStatus === 'IN_PROGRESS' ? 'success' : 'info'">
                      {{ formatTaskStatus(item.taskStatus) }}
                    </ElTag>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!pendingItems.length && !loading" class="p-8">
              <ElEmpty description="当前没有待包埋任务" />
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
            <span>第 {{ filters.page }} 页 / 每页 {{ filters.size }} 条</span>
            <div class="flex gap-2">
              <ElButton
                :disabled="filters.page <= 1"
                @click="
                  filters.page -= 1;
                  loadPendingData();
                "
              >
                上一页
              </ElButton>
              <ElButton
                :disabled="filters.page * filters.size >= total"
                @click="
                  filters.page += 1;
                  loadPendingData();
                "
              >
                下一页
              </ElButton>
            </div>
          </div>
        </article>

        <div class="grid min-h-0 gap-4">
          <EmbeddingWorkstationProcessPanel
            :active="selectedTask ? activeProcessingTaskId === selectedTask.id : false"
            :can-complete="canCompleteCurrentTask"
            :complete-loading="completeLoading"
            :form="completeForm"
            :operator-form="operatorForm"
            :selected-block="selectedBlock"
            :selected-task="selectedTask"
            @cancel="handleCancelEmbedding"
            @complete="handleCompleteEmbedding"
          />

          <article class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 class="text-base font-semibold text-slate-900">当前病例已包埋记录</h2>
                <p class="mt-1 text-sm text-slate-500">
                  右下区域固定展示当前病例的已处理记录，便于连续核对备注与评价。
                </p>
              </div>
              <div v-if="trackingLoading" class="text-sm text-slate-400">加载中...</div>
            </div>

            <div v-if="currentCaseEmbeddingRecords.length" class="overflow-auto">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-500">
                  <tr>
                    <th class="px-4 py-3">病理号</th>
                    <th class="px-4 py-3">蜡块号</th>
                    <th class="px-4 py-3">包埋备注</th>
                    <th class="px-4 py-3">切片备注</th>
                    <th class="px-4 py-3">取材评价</th>
                    <th class="px-4 py-3">取材操作</th>
                    <th class="px-4 py-3">包埋操作</th>
                    <th class="px-4 py-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in currentCaseEmbeddingRecords"
                    :key="item.embeddingId"
                    class="border-t border-slate-100 text-slate-700"
                  >
                    <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
                    <td class="px-4 py-3">{{ formatNullable(item.samplingBlockCode) }}</td>
                    <td class="px-4 py-3">{{ formatNullable(item.embeddingRemarks) }}</td>
                    <td class="px-4 py-3">{{ formatNullable(item.sliceNotice) }}</td>
                    <td class="px-4 py-3">{{ formatNullable(item.samplingEvaluation) }}</td>
                    <td class="px-4 py-3">
                      {{ formatNullable(item.sampledByName) }} /
                      {{ formatDateTime(item.sampledAt) }}
                    </td>
                    <td class="px-4 py-3">
                      {{ formatNullable(item.embeddedByName) }} /
                      {{ formatDateTime(item.endedAt) }}
                    </td>
                    <td class="px-4 py-3">{{ formatTaskStatus(item.taskStatus) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-8">
              <ElEmpty description="当前病例暂无已包埋记录" />
            </div>
          </article>
        </div>
      </section>
    </div>

    <ElDrawer v-model="historyDrawerVisible" size="55%" title="包埋历史">
      <div v-if="currentCaseEmbeddingRecords.length" class="overflow-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3">病理号</th>
              <th class="px-4 py-3">蜡块号</th>
              <th class="px-4 py-3">蜡块名称</th>
              <th class="px-4 py-3">包埋备注</th>
              <th class="px-4 py-3">包埋操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in currentCaseEmbeddingRecords"
              :key="item.embeddingId"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
              <td class="px-4 py-3">{{ formatNullable(item.samplingBlockCode) }}</td>
              <td class="px-4 py-3">{{ formatNullable(item.samplingBlockDescription) }}</td>
              <td class="px-4 py-3">{{ formatNullable(item.embeddingRemarks) }}</td>
              <td class="px-4 py-3">
                {{ formatNullable(item.embeddedByName) }} /
                {{ formatDateTime(item.endedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ElEmpty v-else description="当前病例暂无包埋历史" />
    </ElDrawer>

    <ElDrawer v-model="evaluationDrawerVisible" size="52%" title="评价记录">
      <div v-if="evaluationDrawerRows.length" class="flex flex-col gap-3">
        <article
          v-for="(item, index) in evaluationDrawerRows"
          :key="`${item.category}-${item.title}-${index}`"
          class="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-slate-900">
                {{ item.category }} / {{ item.title }}
              </div>
              <div class="mt-1 text-sm text-slate-500">{{ item.description }}</div>
            </div>
            <div class="text-right text-xs text-slate-400">
              <div>{{ item.status }}</div>
              <div>{{ item.operator }}</div>
              <div>{{ formatDateTime(item.time) }}</div>
            </div>
          </div>
        </article>
      </div>
      <ElEmpty v-else description="当前病例暂无评价记录" />
    </ElDrawer>

    <ElDrawer v-model="taskDrawerVisible" size="70%" title="包埋任务">
      <div class="grid gap-6">
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900">当日待处理任务</h3>
            <span class="text-sm text-slate-500">
              {{ workstationSummary.pendingCount }} 条
            </span>
          </div>
          <div v-if="workstationSummary.pendingTasks.length" class="overflow-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">备注</th>
                  <th class="px-4 py-3">取材操作</th>
                  <th class="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in workstationSummary.pendingTasks"
                  :key="item.id"
                  class="border-t border-slate-100"
                >
                  <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.samplingBlockCode) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.remarks) }}</td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.sampledByName) }} /
                    {{ formatDateTime(item.sampledAt) }}
                  </td>
                  <td class="px-4 py-3">{{ formatTaskStatus(item.taskStatus) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ElEmpty v-else description="当日暂无待处理包埋任务" />
        </section>

        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900">当日已处理记录</h3>
            <span class="text-sm text-slate-500">
              {{ workstationSummary.completedCount }} 条
            </span>
          </div>
          <div v-if="workstationSummary.completedRecords.length" class="overflow-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">包埋备注</th>
                  <th class="px-4 py-3">取材评价</th>
                  <th class="px-4 py-3">包埋操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in workstationSummary.completedRecords"
                  :key="item.embeddingId"
                  class="border-t border-slate-100"
                >
                  <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.samplingBlockCode) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.embeddingRemarks) }}</td>
                  <td class="px-4 py-3">{{ formatNullable(item.samplingEvaluation) }}</td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.embeddedByName) }} /
                    {{ formatDateTime(item.endedAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ElEmpty v-else description="当日暂无已处理包埋记录" />
        </section>
      </div>
    </ElDrawer>
  </Page>
</template>
