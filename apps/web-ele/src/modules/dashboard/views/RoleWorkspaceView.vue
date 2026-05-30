<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { usePreferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { ElAlert, ElMessage } from 'element-plus';

import DashboardChartPanel from '../components/DashboardChartPanel.vue';
import DashboardNotificationSummaryCard from '../components/DashboardNotificationSummaryCard.vue';
import DashboardSectionCard from '../components/DashboardSectionCard.vue';
import DashboardWorkspaceAlertList from '../components/DashboardWorkspaceAlertList.vue';
import DashboardWorkspaceHeroBanner from '../components/DashboardWorkspaceHeroBanner.vue';
import DashboardWorkspaceQuickEntryMatrix from '../components/DashboardWorkspaceQuickEntryMatrix.vue';
import DashboardWorkspaceTodoBoard from '../components/DashboardWorkspaceTodoBoard.vue';
import { useRoleWorkspaceDashboard } from '../composables/useRoleWorkspaceDashboard';
import { buildWorkspaceDistributionChartOption } from '../utils/dashboard-chart-options';
import { getDashboardChartTheme } from '../utils/dashboard-theme';

const userStore = useUserStore();
const router = useRouter();
const { isDark } = usePreferences();
const {
  alertError,
  alertLoading,
  domainData,
  loadAll,
  loadNotifications,
  loadWorkspaceSections,
  notificationError,
  notificationLoading,
  notificationSummary,
  quickEntryGroups,
  quickError,
  quickLoading,
  todoError,
  todoLoading,
  visibleDomainTitles,
  visualSummary,
} = useRoleWorkspaceDashboard();

const currentUserName = computed(
  () => userStore.userInfo?.realName || '当前用户',
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
      <DashboardWorkspaceHeroBanner
        :domain-count="visualSummary.domainSummaries.length"
        :hero-title="visualSummary.heroCard?.title || '当前没有待办事项'"
        :hero-value="visualSummary.heroCard?.value || '0'"
        :quick-entry-count="visualSummary.quickEntries.length"
        :unread-count="notificationSummary.unreadCount"
        :user-name="currentUserName"
        :visible-domain-titles="visibleDomainTitles"
        :warning-risk-count="visualSummary.spotlight.warningRiskCount"
        @refresh="loadAll"
      />

      <ElAlert
        v-if="!todoLoading && domainData.length === 0 && !todoError"
        :closable="false"
        description="当前账号暂未分配首页可展示的业务权限。"
        title="暂无可见首页内容"
        type="info"
      />

      <div class="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div class="flex flex-col gap-4">
          <DashboardWorkspaceTodoBoard
            :error="todoError"
            :hero-card="visualSummary.heroCard"
            :loading="todoLoading"
            :secondary-cards="visualSummary.secondaryCards"
            @open="navigateTo($event.route, $event.query)"
            @open-center="navigateTo('/notifications')"
            @retry="loadWorkspaceSections"
          />

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

            <DashboardWorkspaceQuickEntryMatrix
              :error="quickError"
              :groups="quickEntryGroups"
              :loading="quickLoading"
              @open="navigateTo($event.route, $event.query)"
              @retry="loadWorkspaceSections"
            />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <DashboardWorkspaceAlertList
            :error="alertError"
            :items="visualSummary.alerts"
            :loading="alertLoading"
            @open="navigateTo($event.route, $event.query)"
            @retry="loadWorkspaceSections"
          />

          <DashboardNotificationSummaryCard
            :error="notificationError"
            :loading="notificationLoading"
            :summary="notificationSummary"
            :user-name="currentUserName"
            @open="
              navigateTo($event.actionRoute || '/notifications', $event.query)
            "
            @open-center="navigateTo('/notifications')"
            @retry="loadNotifications"
          />
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
</style>
