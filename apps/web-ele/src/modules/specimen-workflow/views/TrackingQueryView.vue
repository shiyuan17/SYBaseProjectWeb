<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElAlert, ElEmpty, ElTabPane, ElTabs } from 'element-plus';

import { M2_PERMISSION_CODES } from '../constants';

import TrackingApplicationListView from './TrackingApplicationListView.vue';
import TrackingSpecimenListView from './TrackingSpecimenListView.vue';

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
    const normalizedApplicationId = normalizeQueryValue(applicationIdQuery).trim();

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
</script>

<template>
  <Page title="追踪与异常">
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
            :initial-application-id="applicationId"
            :trigger-key="applicationTriggerKey"
          />
        </ElTabPane>
        <ElTabPane
          v-if="canViewSpecimens"
          label="标本列表"
          name="specimens"
        >
          <TrackingSpecimenListView
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
