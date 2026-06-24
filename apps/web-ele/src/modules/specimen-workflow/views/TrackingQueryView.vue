<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElAlert, ElEmpty, ElTabPane, ElTabs } from 'element-plus';

import { M2_PERMISSION_CODES } from '../constants';

const TrackingApplicationListView = defineAsyncComponent(() =>
  import('./TrackingApplicationListView.vue').then((module) => module.default),
);
const TrackingSpecimenListView = defineAsyncComponent(() =>
  import('./TrackingSpecimenListView.vue').then((module) => module.default),
);

type TrackingTab = 'applications' | 'specimens';

const route = useRoute();
const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canViewApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);
const canViewSpecimens = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
);

const activeTab = ref<TrackingTab>('applications');
const loadedTabs = ref<TrackingTab[]>([]);
const applicationId = ref('');
const applicationTriggerKey = ref(0);
const barcode = ref('');
const specimenTriggerKey = ref(0);

function normalizeQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function resolveAvailableTab(preferredTab: TrackingTab): TrackingTab {
  if (preferredTab === 'applications' && canViewApplications.value) {
    return 'applications';
  }
  if (preferredTab === 'specimens' && canViewSpecimens.value) {
    return 'specimens';
  }
  return canViewApplications.value ? 'applications' : 'specimens';
}

watch(
  () =>
    [
      route.query.applicationId,
      route.query.barcode,
      canViewApplications.value,
      canViewSpecimens.value,
    ] as const,
  ([applicationIdQuery, barcodeQuery]) => {
    const normalizedBarcode = normalizeQueryValue(barcodeQuery).trim();
    const normalizedApplicationId =
      normalizeQueryValue(applicationIdQuery).trim();

    if (normalizedBarcode) {
      activeTab.value = resolveAvailableTab('specimens');
      applicationId.value = '';
      barcode.value = normalizedBarcode;
      specimenTriggerKey.value += 1;
      return;
    }

    if (normalizedApplicationId) {
      activeTab.value = resolveAvailableTab('applications');
      applicationId.value = normalizedApplicationId;
      barcode.value = '';
      applicationTriggerKey.value += 1;
      return;
    }

    activeTab.value = resolveAvailableTab('applications');
    applicationId.value = '';
    barcode.value = '';
  },
  { immediate: true },
);

watch(
  activeTab,
  (tab) => {
    if (!loadedTabs.value.includes(tab)) {
      loadedTabs.value = [...loadedTabs.value, tab];
    }
  },
  { immediate: true },
);

function hasLoadedTab(tab: TrackingTab) {
  return loadedTabs.value.includes(tab);
}
</script>

<template>
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="!canViewApplications && !canViewSpecimens"
        :closable="false"
        title="当前账号只有追踪菜单权限，暂无申请单列表或标本列表查看权限。"
        type="info"
        show-icon
      />

      <ElTabs
        v-if="canViewApplications || canViewSpecimens"
        v-model="activeTab"
      >
        <ElTabPane
          v-if="canViewApplications"
          label="申请单列表"
          name="applications"
        >
          <TrackingApplicationListView
            v-if="hasLoadedTab('applications')"
            :initial-application-id="applicationId"
            :trigger-key="applicationTriggerKey"
          />
        </ElTabPane>
        <ElTabPane v-if="canViewSpecimens" label="标本列表" name="specimens">
          <TrackingSpecimenListView
            v-if="hasLoadedTab('specimens')"
            :initial-barcode="barcode"
            :trigger-key="specimenTriggerKey"
          />
        </ElTabPane>
      </ElTabs>

      <div
        v-else
        class="rounded-lg border border-dashed border-border bg-card p-8"
      >
        <ElEmpty description="当前账号暂无追踪列表查看权限" />
      </div>
    </div>
  </Page>
</template>
