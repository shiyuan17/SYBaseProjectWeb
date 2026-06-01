<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElLink,
  ElMessage,
  ElPagination,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  listPendingTechnicalTasks,
  startGrossing,
} from '../api/technical-workflow-service';
import GrossingSpecimenTabs from '../components/GrossingSpecimenTabs.vue';
import TechnicalOperatorFields from '../components/TechnicalOperatorFields.vue';
import TechnicalTaskQueuePanel from '../components/TechnicalTaskQueuePanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { useGrossingWorkbench } from '../composables/useGrossingWorkbench';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatCaseStatus, formatNullable, formatTaskStatus } from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import { buildWorkstationQueueItems } from '../utils/workstation';

const route = useRoute();
const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const queueError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const total = ref(0);

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
  taskType: 'GROSSING',
  timedOutOnly: filters.timedOutOnly,
}));

const workbench = useGrossingWorkbench({
  onSubmitted: async () => {
    await loadPendingData();
  },
});

const queueItems = computed(() =>
  buildWorkstationQueueItems(pendingItems.value, 'GROSSING'),
);
const selectedIndex = computed(() =>
  pendingItems.value.findIndex((item) => item.id === selectedTask.value?.id),
);
const previousTask = computed(() =>
  selectedIndex.value > 0 ? pendingItems.value[selectedIndex.value - 1] : null,
);
const nextTask = computed(() =>
  selectedIndex.value >= 0 &&
  selectedIndex.value < pendingItems.value.length - 1
    ? pendingItems.value[selectedIndex.value + 1]
    : null,
);
const summaryItems = computed(() => {
  const context = workbench.workbenchContext.value;
  const tracking = workbench.trackingResult.value;
  if (!context || !tracking) {
    return [];
  }
  return [
    {
      label: '病理号',
      value: formatNullable(context.caseSummary.pathologyNo),
    },
    {
      label: '病例状态',
      value: formatCaseStatus(context.caseSummary.caseStatus),
    },
    {
      label: '申请科室',
      value: formatNullable(context.caseSummary.submittingDepartmentName),
    },
    {
      label: '标本数',
      value: String(tracking.specimens.length),
    },
    {
      label: '蜡块数',
      value: String(tracking.blocks.length),
    },
    {
      label: '历史影像',
      value: String(context.mediaAssets.length),
    },
  ];
});
const currentPageError = computed(
  () => queueError.value || workbench.pageError.value,
);
const activeSpecimenSummary = computed(() => {
  const specimen = workbench.activeSpecimen.value;
  if (!specimen) {
    return '';
  }
  return [
    specimen.specimenId?.trim() || '未命名标本',
    specimen.specimenType?.trim() || '未设置类型',
    specimen.sizeText?.trim() || '未填写大小',
  ].join(' / ');
});

async function selectTask(taskId: string) {
  const matchedTask =
    pendingItems.value.find((item) => item.id === taskId) ?? null;
  selectedTask.value = matchedTask;
  await workbench.initializeWorkbench(matchedTask);
}

async function selectAdjacentTask(offset: -1 | 1) {
  const targetTask = offset < 0 ? previousTask.value : nextTask.value;
  if (!targetTask) {
    return;
  }
  await selectTask(targetTask.id);
}

async function loadPendingData(preferredTaskId?: string) {
  loading.value = true;
  queueError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId =
      typeof route.query.taskId === 'string' ? route.query.taskId : '';
    const fallbackTaskId =
      preferredTaskId || deepLinkedTaskId || selectedTask.value?.id || '';
    const nextTaskId =
      (fallbackTaskId &&
        result.items.some((item) => item.id === fallbackTaskId) &&
        fallbackTaskId) ||
      result.items[0]?.id ||
      '';

    if (nextTaskId) {
      await selectTask(nextTaskId);
      return;
    }

    selectedTask.value = null;
    workbench.resetWorkbenchState(null);
  } catch (error) {
    queueError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function handleStartOrContinue() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧队列选择任务');
    return;
  }

  if (selectedTask.value.taskStatus !== 'PENDING') {
    await workbench.loadWorkbenchContext();
    ElMessage.success('已刷新当前取材工作台');
    return;
  }

  actionLoading.value = true;
  queueError.value = '';
  try {
    await startGrossing({
      remarks: workbench.operatorForm.remarks.trim() || undefined,
      taskId: selectedTask.value.id,
      terminalCode: workbench.operatorForm.terminalCode.trim() || undefined,
    });
    ElMessage.success(`任务 ${selectedTask.value.id} 已开始取材`);
    await loadPendingData(selectedTask.value.id);
  } catch (error) {
    queueError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="currentPageError"
        :closable="false"
        :title="currentPageError"
        type="error"
        show-icon
      />

      <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div class="flex min-h-0 flex-col gap-4">
          <TechnicalTaskQueuePanel
            :items="queueItems"
            :loading="loading"
            :selected-task-id="selectedTask?.id ?? ''"
            title="待取材任务"
            description="左侧只负责筛选和切换任务，右侧常驻工作台始终承接当前病例的取材录入。"
            @select="(taskId) => void selectTask(taskId)"
          >
            <template #filters>
              <ElForm label-width="56px">
                <ElFormItem label="病理号">
                  <ElInput
                    v-model="filters.pathologyNo"
                    clearable
                    placeholder="病理号/对象号"
                    @keyup.enter="void loadPendingData()"
                  />
                </ElFormItem>
              </ElForm>
            </template>
            <template #extra>
              <ElButton
                :type="filters.timedOutOnly ? 'danger' : 'default'"
                @click="
                  filters.timedOutOnly = !filters.timedOutOnly;
                  void loadPendingData();
                "
              >
                {{ filters.timedOutOnly ? '仅异常' : '全部任务' }}
              </ElButton>
            </template>
          </TechnicalTaskQueuePanel>

          <WorkflowSectionCard title="队列翻页">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @change="void loadPendingData()"
            />
          </WorkflowSectionCard>
        </div>

        <div class="flex flex-col gap-4">
          <WorkflowSectionCard
            title="取材描写工作台"
            description="将开始取材、标本编辑、描述区和上下文收敛到单页工作台，不再依赖弹窗进入主录入。"
          >
            <template #extra>
              <ElTag
                :type="selectedTask?.taskStatus === 'IN_PROGRESS' ? 'warning' : 'info'"
              >
                {{ formatTaskStatus(selectedTask?.taskStatus) }}
              </ElTag>
            </template>

            <template v-if="selectedTask">
              <div class="flex flex-col gap-4">
                <div
                  class="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div class="space-y-2">
                    <div class="text-lg font-semibold text-foreground">
                      {{ formatNullable(selectedTask.pathologyNo) }}
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>任务号 {{ selectedTask.id }}</span>
                      <span>病例 {{ selectedTask.caseId }}</span>
                      <span>对象 {{ formatNullable(selectedTask.objectId) }}</span>
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{
                        selectedTask.taskStatus === 'PENDING'
                          ? '先开始取材，再在下方完成常驻录入。'
                          : '当前任务已处于处理中，可直接继续完善标本与取材描述。'
                      }}
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <ElButton
                      :loading="actionLoading"
                      type="primary"
                      @click="void handleStartOrContinue()"
                    >
                      {{
                        selectedTask.taskStatus === 'PENDING'
                          ? '开始取材'
                          : '继续取材'
                      }}
                    </ElButton>
                    <ElButton
                      :loading="workbench.contextLoading.value"
                      @click="void workbench.loadWorkbenchContext()"
                    >
                      刷新上下文
                    </ElButton>
                    <ElButton
                      @click="
                        navigation.goToTracking({
                          caseId: selectedTask.caseId,
                        })
                      "
                    >
                      查看轨迹
                    </ElButton>
                    <ElButton
                      :disabled="!previousTask"
                      @click="void selectAdjacentTask(-1)"
                    >
                      上一例
                    </ElButton>
                    <ElButton
                      :disabled="!nextTask"
                      @click="void selectAdjacentTask(1)"
                    >
                      下一例
                    </ElButton>
                  </div>
                </div>

                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <article
                    v-for="item in summaryItems"
                    :key="item.label"
                    class="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div class="text-xs text-muted-foreground">
                      {{ item.label }}
                    </div>
                    <div class="mt-1 text-sm font-semibold text-foreground">
                      {{ item.value }}
                    </div>
                  </article>
                </div>

                <ElForm label-width="96px">
                  <TechnicalOperatorFields
                    :form="workbench.operatorForm"
                    remarks-placeholder="必要时补充本次取材说明"
                    terminal-placeholder="取材终端编码"
                  />
                </ElForm>

                <div class="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
                  <WorkflowSectionCard
                    title="标本主从编辑区"
                    description="保留现有稳定的标本、蜡块和影像录入能力，并将其放入工作台主编辑区。"
                  >
                    <div class="mb-4 flex flex-wrap gap-2">
                      <button
                        v-for="(specimenMeta, specimenIndex) in workbench.specimenTabMetas.value"
                        :key="specimenMeta.key"
                        class="rounded-full border px-3 py-1.5 text-sm transition-colors"
                        :class="
                          workbench.activeSpecimenKey.value === specimenMeta.key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground'
                        "
                        type="button"
                        @click="workbench.activeSpecimenKey.value = specimenMeta.key"
                      >
                        {{ workbench.getSpecimenTabLabel(specimenIndex) }}
                      </button>
                    </div>

                    <GrossingSpecimenTabs
                      v-model:active-specimen-key="workbench.activeSpecimenKey.value"
                      :before-grossing-image-upload="
                        workbench.beforeGrossingImageUpload
                      "
                      :body-part-tree-options="
                        workbench.bodyPartTreeOptions.value
                      "
                      :complete-form="workbench.completeForm"
                      :create-grossing-image-upload-request="
                        workbench.createGrossingImageUploadRequest
                      "
                      :get-specimen-tab-label="workbench.getSpecimenTabLabel"
                      :grossing-image-accept="workbench.grossingImageAccept"
                      :is-specimen-uploading="workbench.isSpecimenUploading"
                      :label-class="workbench.labelClass"
                      :sampling-template-tree-options="
                        workbench.samplingTemplateTreeOptions.value
                      "
                      :specimen-tab-metas="workbench.specimenTabMetas.value"
                      :workflow-reference-options="
                        workbench.workflowReferenceOptions.value
                      "
                      @add-block="workbench.addBlock"
                      @add-media-asset="workbench.addMediaAsset"
                      @add-specimen="workbench.addSpecimen"
                      @remove-block="workbench.removeBlock"
                      @remove-media-asset="workbench.removeMediaAsset"
                      @remove-specimen="workbench.removeSpecimen"
                    />
                  </WorkflowSectionCard>

                  <WorkflowSectionCard
                    title="描述区"
                    description="右侧描述区固定承接大体描写、临床病史和相关检查，减少在多个页面来回切换。"
                  >
                    <ElTabs v-model="workbench.descriptionTab.value">
                      <ElTabPane label="大体描写" name="grossDescription">
                        <div class="space-y-3">
                          <div class="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                            {{ activeSpecimenSummary || '选中标本后在这里聚焦录入当前描写。' }}
                          </div>
                          <ElInput
                            v-if="workbench.activeSpecimen.value"
                            v-model="
                              workbench.activeSpecimen.value.grossDescription
                            "
                            :rows="16"
                            placeholder="请输入当前标本的大体描写"
                            type="textarea"
                          />
                          <ElEmpty
                            v-else
                            description="当前没有可编辑的标本描写"
                          />
                        </div>
                      </ElTabPane>

                      <ElTabPane label="临床病史" name="clinicalHistory">
                        <div
                          class="min-h-[360px] whitespace-pre-wrap rounded-lg border border-border bg-muted/10 p-4 text-sm leading-7 text-foreground"
                        >
                          {{
                            workbench.workbenchContext.value?.clinicalHistory ||
                            '当前病例暂无临床病史上下文'
                          }}
                        </div>
                      </ElTabPane>

                      <ElTabPane
                        label="相关检查"
                        name="relatedExaminations"
                      >
                        <div class="space-y-4">
                          <div
                            class="min-h-[220px] whitespace-pre-wrap rounded-lg border border-border bg-muted/10 p-4 text-sm leading-7 text-foreground"
                          >
                            {{
                              workbench.workbenchContext.value
                                ?.relatedExaminations || '当前病例暂无检查摘要'
                            }}
                          </div>
                          <div class="flex flex-wrap gap-2">
                            <ElTag
                              v-for="item in workbench.workbenchContext.value?.checkItems ?? []"
                              :key="`${item.sequenceNo}-${item.name}`"
                              effect="plain"
                            >
                              {{ item.name }}
                            </ElTag>
                          </div>
                        </div>
                      </ElTabPane>
                    </ElTabs>
                  </WorkflowSectionCard>
                </div>

                <div class="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
                  <WorkflowSectionCard
                    title="临床诊断 / 上下文摘要"
                    description="诊断区只读承接临床上下文，不在技术组页面新增可编辑病理诊断录入。"
                  >
                    <div class="grid gap-4 xl:grid-cols-2">
                      <div class="rounded-lg border border-border bg-muted/10 p-4">
                        <div class="text-xs text-muted-foreground">
                          临床诊断
                        </div>
                        <div class="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                          {{
                            workbench.workbenchContext.value
                              ?.clinicalDiagnosis || '暂无临床诊断'
                          }}
                        </div>
                      </div>
                      <div class="rounded-lg border border-border bg-muted/10 p-4">
                        <div class="text-xs text-muted-foreground">
                          上下文摘要
                        </div>
                        <div class="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                          {{
                            workbench.workbenchContext.value?.contextSummary ||
                            '暂无可展示的上下文摘要'
                          }}
                        </div>
                      </div>
                    </div>
                  </WorkflowSectionCard>

                  <WorkflowSectionCard
                    title="已采图像"
                    description="当前录入影像与历史采图并排承接，上传和手工补录仍沿用现有能力。"
                  >
                    <div class="space-y-4">
                      <section>
                        <div class="mb-2 text-xs text-muted-foreground">
                          当前录入
                        </div>
                        <div
                          v-if="workbench.enteredMediaAssets.value.length"
                          class="grid gap-3"
                        >
                          <article
                            v-for="asset in workbench.enteredMediaAssets.value"
                            :key="`${asset.specimenIndex}-${asset.assetIndex}-${asset.fileUrl}`"
                            class="rounded-lg border border-border p-3"
                          >
                            <div class="text-sm font-medium text-foreground">
                              {{ asset.specimenId }}
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                              {{ asset.fileName || '未命名影像' }}
                            </div>
                            <ElLink
                              v-if="asset.fileUrl"
                              :href="asset.fileUrl"
                              class="mt-2"
                              target="_blank"
                              type="primary"
                            >
                              查看影像
                            </ElLink>
                          </article>
                        </div>
                        <ElEmpty v-else description="当前还没有录入影像" />
                      </section>

                      <section>
                        <div class="mb-2 text-xs text-muted-foreground">
                          历史采图
                        </div>
                        <div
                          v-if="workbench.workbenchContext.value?.mediaAssets.length"
                          class="grid gap-3"
                        >
                          <article
                            v-for="asset in workbench.workbenchContext.value.mediaAssets"
                            :key="asset.assetId"
                            class="rounded-lg border border-border p-3"
                          >
                            <div class="text-sm font-medium text-foreground">
                              {{ asset.fileName || '历史影像' }}
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                              {{ formatNullable(asset.capturedAt) }}
                              {{ asset.capturedByName ? ` / ${asset.capturedByName}` : '' }}
                            </div>
                            <ElLink
                              :href="asset.fileUrl"
                              class="mt-2"
                              target="_blank"
                              type="primary"
                            >
                              查看影像
                            </ElLink>
                          </article>
                        </div>
                        <ElEmpty v-else description="当前没有历史采图记录" />
                      </section>
                    </div>
                  </WorkflowSectionCard>
                </div>

                <div class="flex justify-end gap-2">
                  <ElButton
                    :loading="workbench.contextLoading.value"
                    @click="void workbench.loadWorkbenchContext()"
                  >
                    重新加载
                  </ElButton>
                  <ElButton
                    :loading="workbench.submitting.value"
                    type="primary"
                    @click="void workbench.submitGrossing()"
                  >
                    完成取材
                  </ElButton>
                </div>
              </div>
            </template>

            <ElEmpty v-else description="请先从左侧队列选择任务，右侧将自动展开取材工作台" />
          </WorkflowSectionCard>
        </div>
      </div>
    </div>
  </Page>
</template>
