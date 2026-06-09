<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElTabPane, ElTabs } from 'element-plus';

import SpecimenBarcodeBindingPanel from '../components/SpecimenBarcodeBindingPanel.vue';
import SpecimenCheckInPanel from '../components/SpecimenCheckInPanel.vue';
import SpecimenConfirmationPanel from '../components/SpecimenConfirmationPanel.vue';
import SpecimenFixationTimePanel from '../components/SpecimenFixationTimePanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M2_PERMISSION_CODES } from '../constants';
import FixationVerifyView from './FixationVerifyView.vue';
import TransportHandoverView from './TransportHandoverView.vue';

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
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <ElTabs v-model="activeTab">
        <ElTabPane v-if="canVerifyFixation" label="条码绑定" name="binding">
          <WorkflowSectionCard title="条码绑定">
            <SpecimenBarcodeBindingPanel />
          </WorkflowSectionCard>
        </ElTabPane>
        <ElTabPane
          v-if="canVerifyFixation"
          label="离体确认"
          name="verification"
        >
          <FixationVerifyView embedded />
        </ElTabPane>
        <ElTabPane v-if="canVerifyFixation" label="标本固定" name="fixation">
          <WorkflowSectionCard title="标本固定">
            <SpecimenFixationTimePanel />
          </WorkflowSectionCard>
        </ElTabPane>
        <ElTabPane
          v-if="canVerifyFixation"
          label="标本确认"
          name="confirmation"
        >
          <WorkflowSectionCard title="标本确认">
            <SpecimenConfirmationPanel />
          </WorkflowSectionCard>
        </ElTabPane>
        <ElTabPane v-if="canVerifyFixation" label="标本入库" name="check-in">
          <WorkflowSectionCard title="标本入库">
            <SpecimenCheckInPanel />
          </WorkflowSectionCard>
        </ElTabPane>
        <ElTabPane
          v-if="canHandoverTransport"
          label="标本出库"
          name="transport"
        >
          <TransportHandoverView embedded />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
