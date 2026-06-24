<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElTabPane, ElTabs } from 'element-plus';

import { M2_PERMISSION_CODES } from '../constants';

const SpecimenBarcodeBindingPanel = defineAsyncComponent(() =>
  import('../components/SpecimenBarcodeBindingPanel.vue').then(
    (module) => module.default,
  ),
);
const SpecimenCheckInPanel = defineAsyncComponent(() =>
  import('../components/SpecimenCheckInPanel.vue').then(
    (module) => module.default,
  ),
);
const SpecimenConfirmationPanel = defineAsyncComponent(() =>
  import('../components/SpecimenConfirmationPanel.vue').then(
    (module) => module.default,
  ),
);
const SpecimenFixationTimePanel = defineAsyncComponent(() =>
  import('../components/SpecimenFixationTimePanel.vue').then(
    (module) => module.default,
  ),
);
const FixationVerifyView = defineAsyncComponent(() =>
  import('./FixationVerifyView.vue').then((module) => module.default),
);
const TransportHandoverView = defineAsyncComponent(() =>
  import('./TransportHandoverView.vue').then((module) => module.default),
);

type FixationTransportTab =
  | 'binding'
  | 'check-in'
  | 'confirmation'
  | 'fixation'
  | 'transport'
  | 'verification';

const route = useRoute();
const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canVerifyFixation = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.FIXATION_VERIFY),
);
const canHandoverTransport = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.TRANSPORT_HANDOVER),
);

const activeTab = ref<FixationTransportTab>('binding');
const loadedTabs = ref<FixationTransportTab[]>([]);

function resolveAvailableTab(
  preferredTab: FixationTransportTab,
): FixationTransportTab {
  if (preferredTab === 'transport' && canHandoverTransport.value) {
    return 'transport';
  }
  if (
    [
      'binding',
      'check-in',
      'confirmation',
      'fixation',
      'verification',
    ].includes(preferredTab) &&
    canVerifyFixation.value
  ) {
    return preferredTab;
  }
  return canVerifyFixation.value ? 'binding' : 'transport';
}

function resolveRouteInitialTab(): FixationTransportTab {
  if (
    route.query.tab === 'fixation' ||
    route.query.tab === 'binding' ||
    route.query.tab === 'confirmation' ||
    route.query.tab === 'check-in' ||
    route.query.tab === 'transport'
  ) {
    return route.query.tab;
  }
  return 'binding';
}

watch(
  () => [route.query.tab, canVerifyFixation.value, canHandoverTransport.value],
  () => {
    activeTab.value = resolveAvailableTab(resolveRouteInitialTab());
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

function hasLoadedTab(tab: FixationTransportTab) {
  return loadedTabs.value.includes(tab);
}
</script>

<template>
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <ElTabs v-model="activeTab">
        <ElTabPane v-if="canVerifyFixation" label="条码绑定" name="binding">
          <SpecimenBarcodeBindingPanel v-if="hasLoadedTab('binding')" />
        </ElTabPane>
        <ElTabPane
          v-if="canVerifyFixation"
          label="离体确认"
          name="verification"
        >
          <FixationVerifyView v-if="hasLoadedTab('verification')" embedded />
        </ElTabPane>
        <ElTabPane v-if="canVerifyFixation" label="标本固定" name="fixation">
          <SpecimenFixationTimePanel v-if="hasLoadedTab('fixation')" />
        </ElTabPane>
        <ElTabPane
          v-if="canVerifyFixation"
          label="标本确认"
          name="confirmation"
        >
          <SpecimenConfirmationPanel v-if="hasLoadedTab('confirmation')" />
        </ElTabPane>
        <ElTabPane v-if="canVerifyFixation" label="标本入库" name="check-in">
          <SpecimenCheckInPanel v-if="hasLoadedTab('check-in')" />
        </ElTabPane>
        <ElTabPane
          v-if="canHandoverTransport"
          label="标本出库"
          name="transport"
        >
          <TransportHandoverView v-if="hasLoadedTab('transport')" embedded />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
