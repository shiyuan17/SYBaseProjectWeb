<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElTabPane, ElTabs } from 'element-plus';

import { M2_PERMISSION_CODES } from '../constants';

const ApplicationListView = defineAsyncComponent(() =>
  import('./ApplicationListView.vue').then((module) => module.default),
);
const SpecimenManagementView = defineAsyncComponent(() =>
  import('./SpecimenManagementView.vue').then((module) => module.default),
);

type SubmissionTab = 'applications' | 'registration';

const route = useRoute();
const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canManageApplications = computed(
  () =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY) ||
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_CREATE) ||
    accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
);
const canRegisterSpecimens = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
);

const activeTab = ref<SubmissionTab>('applications');
const loadedTabs = ref<SubmissionTab[]>([]);
const registrationApplicationId = ref('');
const registrationTriggerKey = ref(0);

function normalizeQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function resolveAvailableTab(preferredTab: SubmissionTab): SubmissionTab {
  if (preferredTab === 'registration' && canRegisterSpecimens.value) {
    return 'registration';
  }
  if (preferredTab === 'applications' && canManageApplications.value) {
    return 'applications';
  }
  return canRegisterSpecimens.value ? 'registration' : 'applications';
}

watch(
  () =>
    [
      route.query.action,
      route.query.applicationId,
      canManageApplications.value,
      canRegisterSpecimens.value,
    ] as const,
  ([action, applicationId]) => {
    const preferredTab: SubmissionTab =
      action === 'register' ? 'registration' : 'applications';

    activeTab.value = resolveAvailableTab(preferredTab);

    if (action !== 'register') {
      return;
    }

    const normalizedApplicationId = normalizeQueryValue(applicationId).trim();
    if (!normalizedApplicationId) {
      return;
    }

    registrationApplicationId.value = normalizedApplicationId;
    registrationTriggerKey.value += 1;
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

function hasLoadedTab(tab: SubmissionTab) {
  return loadedTabs.value.includes(tab);
}
</script>

<template>
  <Page :show-header="false">
    <ElTabs v-model="activeTab">
      <ElTabPane
        v-if="canManageApplications"
        label="申请管理"
        name="applications"
      >
        <ApplicationListView v-if="hasLoadedTab('applications')" embedded />
      </ElTabPane>
      <ElTabPane
        v-if="canRegisterSpecimens"
        label="标本登记"
        name="registration"
      >
        <SpecimenManagementView
          v-if="hasLoadedTab('registration')"
          embedded
          :registration-application-id="registrationApplicationId"
          :registration-trigger-key="registrationTriggerKey"
        />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
