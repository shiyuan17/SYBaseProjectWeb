<script setup lang="ts">
import type { PendingTechnicalTaskItem, WorkstationSummaryBucket } from '../types/technical-workflow';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElAlert, ElButton, ElSkeleton, ElTag } from 'element-plus';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

import { listPendingTechnicalTasks } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M3_WORKFLOW_ROUTE_ITEMS, TECHNICAL_WORKFLOW_ROUTE_META } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatObjectType,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import { buildWorkstationSummaryBuckets } from '../utils/workstation';

interface WorkflowOverviewCard {
  description: string;
  title: string;
}

interface WorkflowMapCard {
  items: string[];
  title: string;
}

interface WorkflowChainStep {
  actionLabel: string;
  description: string;
  helperText: string;
  routePath?: string;
  title: string;
}

interface WorkflowRiskCard {
  level: 'danger' | 'primary' | 'success' | 'warning';
  title: string;
  value: string;
}

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);
const accessStore = useAccessStore();

const loading = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);

const overviewCards: WorkflowOverviewCard[] = [
  {
    description: '承接病理接收后的实验室内部生产流程，是技术组从病例进入到玻片产出的统一工作区。',
    title: '业务定位',
  },
  {
    description: '围绕取材、脱水、包埋、切片、染色出片、返工和追踪组织流程，不把节点拆成孤立页面。',
    title: '流程范围',
  },
  {
    description: '最终输出可追踪的蜡块、玻片与质控记录，并把诊断所需材料持续推送给下游医生流程。',
    title: '最终结果',
  },
];

const workflowMapCards: WorkflowMapCard[] = [
  {
    items: [
      '病理接收沿用原有页面与权限，不改变既有菜单地址。',
      '技术入口先做流程导览，再把用户带到任务池或目标工位。',
      '技术追踪按病例回看对象树、时间线和异常闭环。',
    ],
    title: '入口与串联',
  },
  {
    items: [
      '常规制片主链覆盖取材、脱水、包埋、切片、染色出片。',
      '任务池统一承接分派、认领、释放和连续处理。',
      '每个工位都围绕同一病例对象持续推进任务状态。',
    ],
    title: '常规制片主链',
  },
  {
    items: [
      '冰冻链独立于常规制片任务池展示，避免语义混淆。',
      '返工和超时任务统一进入异常闭环，而不是散落在各工位。',
      '技术追踪作为返工、质控与主流程核对的统一回看入口。',
    ],
    title: '异常与并行链',
  },
  {
    items: [
      '同一病例会持续关联标本、蜡块、包埋盒和玻片。',
      '超时、处理中和备注会直接影响入口摘要和工位队列排序。',
      '页面更强调“连续处理一条生产链”，而不是单次点状操作。',
    ],
    title: '对象与状态',
  },
];

const workflowSteps: WorkflowChainStep[] = [
  {
    actionLabel: '打开病理接收',
    description: '接收岗完成病例接收、拒收和明细核对，让病例进入技术链起点。',
    helperText: '当前仍沿用原页面和原权限，不改变外部跳转地址。',
    routePath: '/workflow/pathology-receipt',
    title: '步骤 1: 病理接收',
  },
  {
    actionLabel: '进入任务池',
    description: '任务池统一调度待生产任务，适合作为技术组日常分派、认领和连续处理入口。',
    helperText: '当工位间需要切换时，先从任务池确认当前节点和责任人。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.TASKS.path,
    title: '步骤 2: 任务调度',
  },
  {
    actionLabel: '进入取材描写',
    description: '取材描写把病例转换成后续制片对象，是常规主链的首个核心生产节点。',
    helperText: '适合从待处理任务继续加工同一病例的标本与蜡块。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.GROSSING.path,
    title: '步骤 3: 取材描写',
  },
  {
    actionLabel: '进入包埋/切片',
    description: '脱水、包埋、切片按主链连续推进，把蜡块逐步转化为玻片。',
    helperText: '当前入口只保留主链导航，详细操作仍在各工位内完成。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.EMBEDDING.path,
    title: '步骤 4: 制片执行',
  },
  {
    actionLabel: '进入染色出片',
    description: '染色出片承接切片结果，为医生侧后续诊断准备最终可用材料。',
    helperText: '当病例已接近产物输出阶段，可从这里继续推进并核对状态。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.STAINING.path,
    title: '步骤 5: 产物流转',
  },
];

const accessCodes = computed(() => new Set(accessStore.accessCodes));

const canAccessReceipt = computed(() =>
  accessCodes.value.has(M2_PERMISSION_CODES.SPECIMEN_RECEIVE),
);

const canAccessAnyM3 = computed(() =>
  M3_WORKFLOW_ROUTE_ITEMS.some((item) => accessCodes.value.has(item.code)),
);

const canAccessWorkflowEntry = computed(
  () => canAccessAnyM3.value || canAccessReceipt.value,
);

const canAccessFrozen = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.authorityCode),
);

const canAccessRework = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.REWORK.authorityCode),
);

const canAccessTracking = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.TRACKING.authorityCode),
);

const accessibleBuckets = computed<WorkstationSummaryBucket[]>(() =>
  buildWorkstationSummaryBuckets(pendingItems.value).filter((item) => {
    const routeItem = M3_WORKFLOW_ROUTE_ITEMS.find((candidate) => candidate.path === item.path);
    return routeItem ? accessCodes.value.has(routeItem.code) : false;
  }),
);

const regularBuckets = computed(() =>
  accessibleBuckets.value.filter((item) => item.chain === 'REGULAR'),
);

const currentWorkingBucket = computed(() =>
  regularBuckets.value
    .filter((item) => item.inProgress > 0)
    .sort((left, right) => right.inProgress - left.inProgress)[0] ?? regularBuckets.value[0] ?? null,
);

const abnormalItems = computed(() =>
  pendingItems.value
    .filter((item) => item.timedOut || item.taskType === 'REWORK' || item.remarks)
    .slice(0, 8),
);

const frozenReminder = computed(() =>
  pendingItems.value.filter((item) => item.taskType === 'FROZEN' || item.currentNode === 'FROZEN').slice(0, 5),
);

const riskCards = computed<WorkflowRiskCard[]>(() => [
  {
    level: 'warning',
    title: '处理中任务',
    value: String(
      regularBuckets.value.reduce((total, item) => total + item.inProgress, 0),
    ),
  },
  {
    level: 'danger',
    title: '超时风险',
    value: String(
      pendingItems.value.filter((item) => item.timedOut).length,
    ),
  },
  {
    level: 'primary',
    title: '返工闭环',
    value: String(
      pendingItems.value.filter((item) => item.taskType === 'REWORK').length,
    ),
  },
  {
    level: 'success',
    title: '当前可见工位',
    value: String(regularBuckets.value.length),
  },
]);

const workflowLead = computed(() => {
  const regularTaskCount = regularBuckets.value.reduce(
    (total, item) => total + item.pending + item.inProgress,
    0,
  );

  if (!canAccessAnyM3.value) {
    return '当前账号仅开通病理接收入口，可先从接收页进入并等待后续技术权限开通。';
  }

  if (regularTaskCount === 0) {
    return '当前没有常规制片待办，适合直接从任务池、冰冻工作台或技术追踪进入目标页面。';
  }

  return `当前常规制片主链共有 ${regularTaskCount} 条待处理/处理中任务，建议先从任务池确认分派，再进入目标工位连续推进。`;
});

function getRiskTagType(level: WorkflowRiskCard['level']) {
  if (level === 'danger') {
    return 'danger';
  }
  if (level === 'success') {
    return 'success';
  }
  if (level === 'warning') {
    return 'warning';
  }
  return 'info';
}

async function loadDashboard() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks({
      page: 1,
      size: 200,
      timedOutOnly: false,
    });
    pendingItems.value = result.items;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (canAccessAnyM3.value) {
    void loadDashboard();
  }
});
</script>

<template>
  <div v-if="!canAccessWorkflowEntry" class="flex min-h-[360px] items-center justify-center">
    <Fallback status="403" />
  </div>
  <Page
    v-else
    title="制片生产入口"
    description="围绕常规制片主链、冰冻工作台和异常闭环组织入口，让 M3 从任务调度到返工追踪保持连续。"
  >
    <div class="flex flex-col gap-4">
      <section class="overflow-hidden rounded-2xl border border-[#c97a4f]/20 bg-[linear-gradient(135deg,#7a3425_0%,#35241d_100%)] p-6 text-white shadow-sm">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-4xl">
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Technical Workflow
            </div>
            <h2 class="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
              把制片管理从“页面入口”整理成“可连续推进的生产流程”
            </h2>
            <p class="mt-3 text-sm leading-6 text-white/85 md:text-base">
              当前入口页同时承担流程导览、任务摘要和异常提醒，让接收、常规制片、冰冻和返工追踪在一个视图里形成连续认知。
            </p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">主菜单：制片管理</span>
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">对象：病例 / 标本 / 蜡块 / 玻片</span>
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">目标：从任务调度推进到产物流转</span>
            </div>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl">
            <div
              v-for="item in riskCards"
              :key="item.title"
              class="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm text-white/78">{{ item.title }}</div>
                <ElTag :type="getRiskTagType(item.level)">{{ item.title }}</ElTag>
              </div>
              <div class="mt-3 text-3xl font-semibold leading-none text-white">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </section>

      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="模块概览"
        description="先回答技术组当前在做什么、覆盖哪些链路、最后把什么交给下游。"
      >
        <div class="grid gap-4 md:grid-cols-3">
          <article
            v-for="item in overviewCards"
            :key="item.title"
            class="rounded-2xl border border-border bg-[linear-gradient(180deg,var(--el-bg-color)_0%,rgba(250,245,240,0.6)_100%)] p-4"
          >
            <div class="text-base font-semibold text-foreground">{{ item.title }}</div>
            <div class="mt-2 text-sm leading-6 text-muted-foreground">{{ item.description }}</div>
          </article>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="核心功能地图"
        description="把入口、主链、异常链和对象状态放在同一张图里，帮助现场先建立全局认知。"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="item in workflowMapCards"
            :key="item.title"
            class="rounded-2xl border border-border bg-card p-4"
          >
            <div class="text-base font-semibold text-foreground">{{ item.title }}</div>
            <ul class="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li v-for="entry in item.items" :key="entry">{{ entry }}</li>
            </ul>
          </article>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="典型工作流程"
        description="参考旧系统的技术工作站分析，把当前 Web 入口整理为从接收到染色出片的连续主链。"
      >
        <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="flex flex-col gap-3">
            <article
              v-for="item in workflowSteps"
              :key="item.title"
              class="rounded-2xl border border-border bg-[linear-gradient(180deg,#fff,#fbf7f2)] p-4"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div class="max-w-3xl">
                  <div class="inline-flex rounded-full bg-[#f4dfd9] px-3 py-1 text-xs font-semibold text-[#8c3f2f]">
                    {{ item.title }}
                  </div>
                  <div class="mt-3 text-base font-semibold text-foreground">{{ item.description }}</div>
                  <div class="mt-2 text-sm leading-6 text-muted-foreground">{{ item.helperText }}</div>
                </div>
                <ElButton
                  v-if="item.routePath"
                  class="shrink-0"
                  type="primary"
                  @click="navigation.goToPath(item.routePath)"
                >
                  {{ item.actionLabel }}
                </ElButton>
              </div>
            </article>
          </div>

          <div class="rounded-2xl border border-border bg-[linear-gradient(180deg,#fffaf2,#fffdf9)] p-5">
            <div class="text-base font-semibold text-foreground">当前流程建议</div>
            <div class="mt-3 text-sm leading-6 text-muted-foreground">
              {{ workflowLead }}
            </div>
            <div class="mt-5 flex flex-col gap-3">
              <button
                class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                type="button"
                @click="currentWorkingBucket ? navigation.goToPath(currentWorkingBucket.path, { mode: currentWorkingBucket.inProgress > 0 ? 'queue' : 'exception' }) : navigation.goToTasks()"
              >
                <div class="text-sm font-semibold text-foreground">继续当前工位处理中任务</div>
                <div class="mt-2 text-xs leading-5 text-muted-foreground">
                  {{ currentWorkingBucket ? `${currentWorkingBucket.title} 当前处理中 ${currentWorkingBucket.inProgress} 条` : '当前没有正在处理中的工位任务，可直接进入任务池。' }}
                </div>
              </button>

              <button
                class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                type="button"
                @click="navigation.goToTasks({ mode: 'queue' })"
              >
                <div class="text-sm font-semibold text-foreground">进入任务池调度</div>
                <div class="mt-2 text-xs leading-5 text-muted-foreground">
                  任务池继续作为 M3 唯一统一调度入口，适合分派、释放和按病例连续处理。
                </div>
              </button>
            </div>
          </div>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="canAccessReceipt"
        title="病理接收入口"
        description="病理接收菜单已归入制片管理，接收岗可从这里继续沿用原页面和原权限完成接收。"
      >
        <div class="rounded-2xl border border-border bg-card p-4">
          <div class="text-sm font-semibold text-foreground">进入病理接收</div>
          <div class="mt-2 text-xs text-muted-foreground">
            页面地址仍保持 `/workflow/pathology-receipt`，不影响现有业务链路和外部跳转。
          </div>
          <div class="mt-3">
            <ElButton type="primary" @click="navigation.goToPath('/workflow/pathology-receipt')">
              打开病理接收
            </ElButton>
          </div>
        </div>
      </WorkflowSectionCard>

      <template v-if="canAccessAnyM3">
        <WorkflowSectionCard
          title="常规制片总览"
          description="当前常规制片主链按任务池统一调度，支持从入口继续处理中任务或直接进入调度视图。"
        >
          <ElSkeleton v-if="loading" :rows="6" animated />
          <div v-else class="flex flex-col gap-4">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article
                v-for="item in regularBuckets"
                :key="item.taskType"
                class="rounded-2xl border border-border bg-card p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-foreground">{{ item.title }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">当前工位队列摘要</div>
                  </div>
                  <ElTag :type="item.timedOut > 0 ? 'danger' : item.inProgress > 0 ? 'warning' : 'info'">
                    {{ item.timedOut > 0 ? '异常' : '正常' }}
                  </ElTag>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div class="rounded-xl bg-muted px-2 py-3">
                    <div class="text-xs text-muted-foreground">待处理</div>
                    <div class="mt-1 text-lg font-semibold text-foreground">{{ item.pending }}</div>
                  </div>
                  <div class="rounded-xl bg-muted px-2 py-3">
                    <div class="text-xs text-muted-foreground">处理中</div>
                    <div class="mt-1 text-lg font-semibold text-foreground">{{ item.inProgress }}</div>
                  </div>
                  <div class="rounded-xl bg-muted px-2 py-3">
                    <div class="text-xs text-muted-foreground">超时</div>
                    <div class="mt-1 text-lg font-semibold text-foreground">{{ item.timedOut }}</div>
                  </div>
                </div>
              </article>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <button
                class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                type="button"
                @click="currentWorkingBucket ? navigation.goToPath(currentWorkingBucket.path, { mode: currentWorkingBucket.inProgress > 0 ? 'queue' : 'exception' }) : navigation.goToTasks()"
              >
                <div class="text-sm font-semibold text-foreground">继续当前工位处理中任务</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ currentWorkingBucket ? `${currentWorkingBucket.title} 当前处理中 ${currentWorkingBucket.inProgress} 条` : '当前没有正在处理中的工位任务，可直接进入任务池。' }}
                </div>
              </button>

              <button
                class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                type="button"
                @click="navigation.goToTasks({ mode: 'queue' })"
              >
                <div class="text-sm font-semibold text-foreground">进入任务池调度</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  任务池继续作为 M3 唯一统一调度入口，适合分派、释放和按病例连续处理。
                </div>
              </button>

              <button
                class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canAccessFrozen"
                type="button"
                @click="navigation.goToFrozen()"
              >
                <div class="text-sm font-semibold text-foreground">进入冰冻工作台</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  冰冻链作为并列技术链独立展示，不混入常规制片任务池。
                </div>
              </button>

              <div class="rounded-2xl border border-border bg-card p-4">
                <div class="text-sm font-semibold text-foreground">返工 / 技术追踪</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  从异常入口进入返工闭环，或按病例进入技术追踪核对主流程与质控事件。
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <ElButton v-if="canAccessRework" size="small" type="warning" @click="navigation.goToRework({ mode: 'exception' })">
                    返工
                  </ElButton>
                  <ElButton v-if="canAccessTracking" plain size="small" type="primary" @click="navigation.goToTracking()">
                    技术追踪
                  </ElButton>
                </div>
              </div>
            </div>
          </div>
        </WorkflowSectionCard>

        <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <WorkflowSectionCard
            title="冰冻工作台提醒"
            description="冰冻链保持独立入口，在入口页只承担提醒和快速进入，避免与常规技术任务语义混淆。"
          >
            <div v-if="!canAccessFrozen" class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              当前账号未开通冰冻工作台权限。
            </div>
            <div v-else class="flex flex-col gap-3">
              <div class="rounded-2xl border border-border bg-card p-4">
                <div class="text-sm font-semibold text-foreground">冰冻并列技术链</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  当前先通过入口页和导航层明确展示冰冻链，后续第二阶段再考虑统一摘要与设备联动。
                </div>
                <div class="mt-3">
                  <ElButton type="primary" @click="navigation.goToFrozen()">打开冰冻工作台</ElButton>
                </div>
              </div>

              <article
                v-for="item in frozenReminder"
                :key="item.id"
                class="rounded-2xl border border-border bg-card p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-foreground">{{ formatNullable(item.pathologyNo) }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ formatTaskType(item.taskType) }} / {{ formatNullable(item.objectId) }}
                    </div>
                  </div>
                  <ElTag :type="item.timedOut ? 'danger' : 'info'">
                    {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
                  </ElTag>
                </div>
              </article>

              <div
                v-if="frozenReminder.length === 0"
                class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
              >
                当前没有来自统一任务列表的冰冻提醒，冰冻链仍可从独立工作台进入。
              </div>
            </div>
          </WorkflowSectionCard>

          <WorkflowSectionCard
            title="异常与返工入口"
            description="入口页统一承接超时、返工和带备注任务，强调返工/追踪属于同一异常闭环，而不是散落在各工位说明里。"
          >
            <div v-if="abnormalItems.length > 0" class="flex flex-col gap-3">
              <article
                v-for="item in abnormalItems"
                :key="item.id"
                class="rounded-2xl border border-border bg-card p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-foreground">
                      {{ formatNullable(item.pathologyNo) }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ formatTaskType(item.taskType) }} / {{ formatObjectType(item.objectType) }} / {{ formatNullable(item.objectId) }}
                    </div>
                  </div>
                  <ElTag :type="item.timedOut ? 'danger' : item.taskType === 'REWORK' ? 'warning' : 'info'">
                    {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
                  </ElTag>
                </div>
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ item.remarks ? `备注：${item.remarks}` : '当前任务无备注信息。' }}
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <ElButton
                    link
                    type="primary"
                    @click="item.taskType === 'REWORK' ? navigation.goToRework({ caseId: item.caseId, mode: 'exception', pathologyNo: item.pathologyNo ?? undefined }) : navigation.goToTask(item, 'exception')"
                  >
                    进入处理
                  </ElButton>
                  <ElButton
                    v-if="canAccessTracking"
                    link
                    @click="navigation.goToTracking({ caseId: item.caseId, objectId: item.objectId ?? undefined, objectType: item.objectType ?? undefined, pathologyNo: item.pathologyNo ?? undefined, taskId: item.id, tab: 'abnormal' })"
                  >
                    查看追踪
                  </ElButton>
                </div>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              当前没有异常任务
            </div>
          </WorkflowSectionCard>
        </div>
      </template>
    </div>
  </Page>
</template>
