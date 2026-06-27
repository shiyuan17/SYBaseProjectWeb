<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';

import { BRAND_LOGO_SOURCE, BRAND_NAME } from '#/preferences-branding';

import PathologyDashboardCenterColumn from '../components/pathology-screen/PathologyDashboardCenterColumn.vue';
import PathologyDashboardHeader from '../components/pathology-screen/PathologyDashboardHeader.vue';
import PathologyDashboardLeftColumn from '../components/pathology-screen/PathologyDashboardLeftColumn.vue';
import PathologyDashboardLoadingSkeleton from '../components/pathology-screen/PathologyDashboardLoadingSkeleton.vue';
import PathologyDashboardRightColumn from '../components/pathology-screen/PathologyDashboardRightColumn.vue';
import { usePathologyDashboardScreen } from '../composables/usePathologyDashboardScreen';
import {
  buildPathologyDashboardPartialNotes,
  buildPathologyDashboardSummaryTitleParts,
} from '../utils/pathology-dashboard-presentation';

import '../styles/pathology-dashboard.css';

const router = useRouter();
const specimenCollectionHomeRouteLocation = {
  name: 'ApplicationRegistrationWorkbench',
} as const;

const { blockingError, dashboard, initialLoading, loadState, refreshError } =
  usePathologyDashboardScreen();

const summaryTitleParts = computed(() =>
  buildPathologyDashboardSummaryTitleParts(BRAND_NAME),
);
const partialNotes = computed(() =>
  dashboard.value ? buildPathologyDashboardPartialNotes(dashboard.value) : [],
);

function enterSpecimenCollectionHome() {
  void router.push(specimenCollectionHomeRouteLocation);
}
</script>

<template>
  <PathologyDashboardLoadingSkeleton v-if="initialLoading" />

  <div v-else-if="loadState === 'forbidden'" class="pathology-fallback">
    <Fallback status="403" />
  </div>

  <div
    v-else-if="loadState === 'error'"
    class="pathology-fallback pathology-fallback--error"
  >
    <div class="pathology-loading__card">
      <h2>病理大屏加载失败</h2>
      <p>{{ blockingError }}</p>
    </div>
  </div>

  <div v-else-if="dashboard" class="pathology-screen">
    <div class="pathology-screen__grid"></div>
    <div class="pathology-screen__glow pathology-screen__glow--left"></div>
    <div class="pathology-screen__glow pathology-screen__glow--right"></div>

    <main class="pathology-screen__canvas">
      <PathologyDashboardHeader
        :brand-logo-source="BRAND_LOGO_SOURCE"
        :brand-name="BRAND_NAME"
        :partial-notes="partialNotes"
        :title-prefix="summaryTitleParts.prefix"
        :title-suffix="summaryTitleParts.suffix"
        @exit="enterSpecimenCollectionHome"
      />

      <section
        v-if="refreshError"
        class="pathology-refresh"
        data-testid="pathology-refresh-banner"
      >
        <strong>数据刷新失败</strong>
        <p>{{ refreshError }}，当前展示最近一次结果。</p>
      </section>

      <section class="pathology-screen__content">
        <PathologyDashboardLeftColumn :dashboard="dashboard" />
        <PathologyDashboardCenterColumn :dashboard="dashboard" />
        <PathologyDashboardRightColumn :dashboard="dashboard" />
      </section>
    </main>
  </div>
</template>
