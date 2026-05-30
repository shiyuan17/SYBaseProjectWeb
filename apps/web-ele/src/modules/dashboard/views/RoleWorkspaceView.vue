<script setup lang="ts">
import type {
  DashboardDomainData,
  DashboardNotificationSummary,
} from '../types/dashboard';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElMessage,
  ElSkeleton,
  ElTag,
} from 'element-plus';

import {
  loadDoctorDomainData,
  loadNotificationSummary,
  loadOperationDomainData,
  loadQualityDomainData,
  loadSpecimenDomainData,
  loadTechnicalDomainData,
} from '../api/dashboard-service';
import DashboardChartPanel from '../components/DashboardChartPanel.vue';
import DashboardSectionCard from '../components/DashboardSectionCard.vue';
import { buildWorkspaceDistributionChartOption } from '../utils/dashboard-chart-options';
import { getDashboardChartTheme } from '../utils/dashboard-theme';
import {
  buildWorkspaceVisualSummary,
  getVisualToneClasses,
  groupQuickEntriesByDomain,
} from '../utils/dashboard-visualization';

const accessStore = useAccessStore();
const userStore = useUserStore();
const router = useRouter();
const { isDark } = usePreferences();

const todoLoading = ref(false);
const alertLoading = ref(false);
const quickLoading = ref(false);
const notificationLoading = ref(false);

const todoError = ref('');
const alertError = ref('');
const quickError = ref('');
const notificationError = ref('');

const domainData = ref<DashboardDomainData[]>([]);
const notificationSummary = ref<DashboardNotificationSummary>({
  items: [],
  unreadCount: 0,
});

const visibleDomainTitles = computed(() =>
  domainData.value.map((item) => item.title).join(' / '),
);

const visualSummary = computed(() =>
  buildWorkspaceVisualSummary(domainData.value),
);
const quickEntryGroups = computed(() =>
  groupQuickEntriesByDomain(visualSummary.value.quickEntries),
);
const chartTheme = computed(() => getDashboardChartTheme(isDark.value));

const workspaceDistributionOption = computed(() =>
  buildWorkspaceDistributionChartOption(
    visualSummary.value.distribution,
    chartTheme.value,
  ),
);

async function navigateTo(
  route?: string,
  query?: Record<string, string>,
  fallbackMessage: string = '当前入口暂不可用',
) {
  if (!route) {
    ElMessage.warning(fallbackMessage);
    return;
  }
  await router.push({
    path: route,
    query,
  });
}

async function loadWorkspaceSections() {
  const accessCodes = [...accessStore.accessCodes];

  todoLoading.value = true;
  alertLoading.value = true;
  quickLoading.value = true;
  todoError.value = '';
  alertError.value = '';
  quickError.value = '';

  try {
    const domains = await Promise.all([
      loadSpecimenDomainData(accessCodes),
      loadTechnicalDomainData(accessCodes),
      loadDoctorDomainData(accessCodes),
      loadOperationDomainData(accessCodes),
      loadQualityDomainData(accessCodes),
    ]);
    domainData.value = domains.filter(
      (item): item is DashboardDomainData => item !== null,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '工作台加载失败，请稍后重试';
    todoError.value = message;
    alertError.value = message;
    quickError.value = message;
    domainData.value = [];
  } finally {
    todoLoading.value = false;
    alertLoading.value = false;
    quickLoading.value = false;
  }
}

async function loadNotifications() {
  notificationLoading.value = true;
  notificationError.value = '';
  try {
    notificationSummary.value = await loadNotificationSummary();
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : '通知加载失败，请稍后重试';
    notificationSummary.value = {
      items: [],
      unreadCount: 0,
    };
  } finally {
    notificationLoading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadWorkspaceSections(), loadNotifications()]);
}

onMounted(() => {
  void loadAll();
});
</script>

<template>
  <Page
    title="角色工作台"
    :description="
      visibleDomainTitles
        ? `汇总 ${visibleDomainTitles} 的待办、预警、快捷入口与通知。`
        : '汇总当前权限下的待办、预警、快捷入口与通知。'
    "
  >
    <div class="flex flex-col gap-6">
      <section
        class="dashboard-hero relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-6 text-foreground shadow-sm"
      >
        <div
          class="dashboard-hero__backdrop pointer-events-none absolute inset-0"
        ></div>
        <div class="relative flex flex-col gap-6">
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div class="max-w-3xl">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
              >
                <span>角色驾驶舱</span>
                <span class="text-[var(--el-border-color)]">•</span>
                <span>{{ visibleDomainTitles || '待办聚焦模式' }}</span>
              </div>
              <h2
                class="mt-4 text-3xl font-semibold tracking-tight text-foreground"
              >
                你好，{{ userStore.userInfo?.realName || '当前用户' }}
              </h2>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                当前页面汇总角色待办、预警、常用入口与通知。
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <span
                class="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
              >
                未读通知 {{ notificationSummary.unreadCount }}
              </span>
              <ElButton
                class="!border-border !bg-background/85 !text-foreground hover:!border-primary/40 hover:!bg-primary/5"
                plain
                @click="loadAll"
              >
                刷新工作台
              </ElButton>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article
              class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
            >
              <div
                class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              >
                重点待办
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ visualSummary.heroCard?.value || '0' }}
              </div>
              <div class="mt-2 text-sm text-muted-foreground">
                {{ visualSummary.heroCard?.title || '当前没有待办事项' }}
              </div>
            </article>
            <article
              class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
            >
              <div
                class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              >
                高风险预警
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ visualSummary.spotlight.warningRiskCount }}
              </div>
              <div class="mt-2 text-sm text-muted-foreground">
                包含高风险与提醒级异常
              </div>
            </article>
            <article
              class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
            >
              <div
                class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              >
                业务域覆盖
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ visualSummary.domainSummaries.length }}
              </div>
              <div class="mt-2 text-sm text-muted-foreground">
                当前首页共汇聚 {{ visibleDomainTitles || '暂无可见域' }}
              </div>
            </article>
            <article
              class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
            >
              <div
                class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
              >
                快捷入口
              </div>
              <div class="mt-3 text-3xl font-semibold text-foreground">
                {{ visualSummary.quickEntries.length }}
              </div>
              <div class="mt-2 text-sm text-muted-foreground">
                当前权限下的常用入口
              </div>
            </article>
          </div>
        </div>
      </section>

      <ElAlert
        v-if="!todoLoading && domainData.length === 0 && !todoError"
        :closable="false"
        description="当前账号暂未分配首页可展示的业务权限。"
        title="暂无可见首页内容"
        type="info"
      />

      <div class="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div class="flex flex-col gap-4">
          <DashboardSectionCard
            title="我的待办驾驶舱"
            description="展示当前待办卡片。"
            card-class="dashboard-surface border-0"
            body-class="px-5 pb-5 pt-2"
          >
            <div
              v-if="todoError"
              class="flex items-center justify-between gap-4"
            >
              <span class="text-sm text-danger">{{ todoError }}</span>
              <ElButton @click="loadWorkspaceSections">重试</ElButton>
            </div>
            <ElSkeleton v-else-if="todoLoading" :rows="8" animated />
            <div
              v-else-if="visualSummary.heroCard"
              class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <article
                class="relative overflow-hidden rounded-[28px] border border-border bg-card/90 p-5 text-foreground shadow-sm"
              >
                <div
                  class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-85"
                  :class="
                    getVisualToneClasses(
                      visualSummary.heroCard.tone === 'info'
                        ? 'primary'
                        : visualSummary.heroCard.tone,
                    ).glow
                  "
                ></div>
                <div
                  class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--el-bg-color)_82%,transparent),color-mix(in_srgb,var(--el-bg-color-page)_36%,transparent))]"
                ></div>
                <div class="relative flex h-full flex-col">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <span
                        class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium"
                        :class="
                          getVisualToneClasses(
                            visualSummary.heroCard.tone === 'info'
                              ? 'primary'
                              : visualSummary.heroCard.tone,
                          ).badge
                        "
                      >
                        {{ visualSummary.heroCard.domainTitle }}
                      </span>
                      <div class="mt-3 text-lg font-semibold text-foreground">
                        {{ visualSummary.heroCard.title }}
                      </div>
                    </div>
                    <ElTag
                      :type="
                        visualSummary.heroCard.tone === 'danger'
                          ? 'danger'
                          : visualSummary.heroCard.tone === 'warning'
                            ? 'warning'
                            : visualSummary.heroCard.tone === 'success'
                              ? 'success'
                              : 'info'
                      "
                    >
                      {{ visualSummary.heroCard.tag || '待办' }}
                    </ElTag>
                  </div>
                  <div
                    class="mt-8 text-5xl font-semibold tracking-tight text-foreground"
                  >
                    {{ visualSummary.heroCard.value }}
                  </div>
                  <p
                    class="mt-3 max-w-[30ch] text-sm leading-6 text-muted-foreground"
                  >
                    {{ visualSummary.heroCard.description }}
                  </p>
                  <div class="mt-6 flex flex-wrap gap-3">
                    <ElButton
                      type="primary"
                      @click="
                        navigateTo(
                          visualSummary.heroCard.route,
                          visualSummary.heroCard.query,
                        )
                      "
                    >
                      进入处理
                    </ElButton>
                    <ElButton plain @click="navigateTo('/notifications')">
                      查看协同消息
                    </ElButton>
                  </div>
                </div>
              </article>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <article
                  v-for="card in visualSummary.secondaryCards"
                  :key="card.id"
                  class="rounded-[24px] border border-border bg-card/80 p-4 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div
                        class="text-xs uppercase tracking-[0.16em] text-[var(--el-text-color-secondary)]"
                      >
                        {{ card.domainTitle }}
                      </div>
                      <div class="mt-2 text-sm font-semibold text-foreground">
                        {{ card.title }}
                      </div>
                    </div>
                    <span
                      class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                      :class="
                        getVisualToneClasses(
                          card.tone === 'info' ? 'info' : card.tone,
                        ).badge
                      "
                    >
                      {{ card.tag || '待办' }}
                    </span>
                  </div>
                  <div class="mt-4 flex items-end justify-between gap-3">
                    <div class="text-3xl font-semibold text-foreground">
                      {{ card.value }}
                    </div>
                    <button
                      class="text-xs text-muted-foreground transition-colors hover:text-primary"
                      type="button"
                      @click="navigateTo(card.route, card.query)"
                    >
                      进入 →
                    </button>
                  </div>
                </article>
              </div>
            </div>
            <ElEmpty v-else description="暂无待办事项" />
          </DashboardSectionCard>

          <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <DashboardSectionCard
              title="待办分布"
              description="按业务域聚合当前角色的待办数量。"
              card-class="dashboard-surface border-0"
              body-class="px-5 pb-5 pt-2"
            >
              <DashboardChartPanel
                :error="todoError"
                :loading="todoLoading"
                :option="workspaceDistributionOption"
                empty-description="暂无待办分布数据"
                height="280px"
                @retry="loadWorkspaceSections"
              />
            </DashboardSectionCard>

            <DashboardSectionCard
              title="快捷入口矩阵"
              description="按业务域分组展示常用入口。"
              card-class="dashboard-surface border-0"
              body-class="px-5 pb-5 pt-2"
            >
              <div
                v-if="quickError"
                class="flex items-center justify-between gap-4"
              >
                <span class="text-sm text-danger">{{ quickError }}</span>
                <ElButton @click="loadWorkspaceSections">重试</ElButton>
              </div>
              <ElSkeleton v-else-if="quickLoading" :rows="6" animated />
              <div v-else-if="quickEntryGroups.length > 0" class="grid gap-4">
                <section
                  v-for="group in quickEntryGroups"
                  :key="group.domainId"
                  class="rounded-[24px] border border-border bg-card/75 p-4 shadow-sm"
                >
                  <div class="mb-3 text-sm font-semibold text-foreground">
                    {{ group.domainTitle }}
                  </div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <button
                      v-for="entry in group.entries"
                      :key="entry.id"
                      class="rounded-[18px] border border-border bg-background/80 p-4 text-left text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                      type="button"
                      @click="navigateTo(entry.route, entry.query)"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="text-sm font-semibold text-foreground">
                          {{ entry.title }}
                        </div>
                        <span
                          v-if="entry.highlight"
                          class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                        >
                          推荐
                        </span>
                      </div>
                      <div class="mt-2 text-xs leading-5 text-muted-foreground">
                        {{ entry.description }}
                      </div>
                    </button>
                  </div>
                </section>
              </div>
              <ElEmpty v-else description="暂无快捷入口" />
            </DashboardSectionCard>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <DashboardSectionCard
            title="异常 / 预警流"
            description="按严重度展示异常和预警。"
            card-class="dashboard-surface border-0"
            body-class="px-5 pb-5 pt-2"
          >
            <div
              v-if="alertError"
              class="flex items-center justify-between gap-4"
            >
              <span class="text-sm text-danger">{{ alertError }}</span>
              <ElButton @click="loadWorkspaceSections">重试</ElButton>
            </div>
            <ElSkeleton v-else-if="alertLoading" :rows="7" animated />
            <div
              v-else-if="visualSummary.alerts.length > 0"
              class="flex flex-col gap-3"
            >
              <article
                v-for="item in visualSummary.alerts"
                :key="item.id"
                class="rounded-[22px] border border-border bg-card/80 p-4 text-foreground shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div
                      class="text-xs uppercase tracking-[0.16em] text-[var(--el-text-color-secondary)]"
                    >
                      {{ item.domainTitle }}
                    </div>
                    <div class="mt-2 text-sm font-semibold text-foreground">
                      {{ item.title }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ item.source }}
                    </div>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    :class="
                      getVisualToneClasses(
                        item.severity === 'danger'
                          ? 'danger'
                          : item.severity === 'warning'
                            ? 'warning'
                            : 'info',
                      ).badge
                    "
                  >
                    {{
                      item.severity === 'danger'
                        ? '高风险'
                        : item.severity === 'warning'
                          ? '提醒'
                          : '关注'
                    }}
                  </span>
                </div>
                <div class="mt-3 text-sm leading-6 text-muted-foreground">
                  {{ item.description }}
                </div>
                <button
                  class="mt-4 text-sm text-primary transition-colors hover:text-primary/80"
                  type="button"
                  @click="navigateTo(item.route, item.query)"
                >
                  {{ item.actionLabel || '查看详情' }} →
                </button>
              </article>
            </div>
            <ElEmpty v-else description="当前没有异常或预警" />
          </DashboardSectionCard>

          <DashboardSectionCard
            title="通知与协同"
            :description="`展示 ${userStore.userInfo?.realName || '当前用户'} 的站内通知和协同动作。`"
            card-class="dashboard-surface border-0"
            body-class="px-5 pb-5 pt-2"
          >
            <template #header-extra>
              <ElTag
                :type="notificationSummary.unreadCount > 0 ? 'warning' : 'info'"
              >
                未读 {{ notificationSummary.unreadCount }}
              </ElTag>
            </template>

            <div
              v-if="notificationError"
              class="flex items-center justify-between gap-4"
            >
              <span class="text-sm text-danger">{{ notificationError }}</span>
              <ElButton @click="loadNotifications">重试</ElButton>
            </div>
            <ElSkeleton v-else-if="notificationLoading" :rows="5" animated />
            <div
              v-else-if="notificationSummary.items.length > 0"
              class="flex flex-col gap-3"
            >
              <article
                v-for="item in notificationSummary.items"
                :key="item.id"
                class="rounded-[22px] border border-border bg-card/80 p-4 text-foreground shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-foreground">
                      {{ item.title }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ item.createdAt || '-' }}
                    </div>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    :class="
                      getVisualToneClasses(
                        item.status === 'UNREAD' ? 'warning' : 'neutral',
                      ).badge
                    "
                  >
                    {{ item.status === 'UNREAD' ? '未读' : '已读' }}
                  </span>
                </div>
                <div class="mt-3 text-sm leading-6 text-muted-foreground">
                  {{ item.summary }}
                </div>
                <div class="mt-4 flex gap-3">
                  <button
                    class="text-sm text-primary transition-colors hover:text-primary/80"
                    type="button"
                    @click="
                      navigateTo(
                        item.actionRoute || '/notifications',
                        item.query,
                      )
                    "
                  >
                    查看 →
                  </button>
                  <button
                    class="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                    @click="navigateTo('/notifications')"
                  >
                    通知中心
                  </button>
                </div>
              </article>
            </div>
            <ElEmpty v-else description="暂无通知消息" />
          </DashboardSectionCard>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.dashboard-surface.el-card) {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color) 96%, transparent),
      color-mix(in srgb, var(--el-fill-color-light) 55%, transparent)
    ),
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 28%
    );
  border: 1px solid var(--el-border-color);
  box-shadow: 0 18px 36px -28px
    color-mix(in srgb, var(--el-text-color-primary) 22%, transparent);
}

:deep(.dashboard-surface .el-card__header) {
  padding: 18px 20px 14px;
  border-bottom: 1px solid
    color-mix(in srgb, var(--el-border-color) 88%, transparent);
}

.dashboard-hero__backdrop {
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 16%, transparent),
      transparent 34%
    ),
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--el-color-success) 14%, transparent),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-bg-color) 92%, transparent),
      color-mix(in srgb, var(--el-fill-color-light) 78%, transparent)
    );
}
</style>
