<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElTabPane, ElTabs } from 'element-plus';

import { M2_PERMISSION_CODES } from '../constants';

import FixationVerifyView from './FixationVerifyView.vue';
import TransportHandoverView from './TransportHandoverView.vue';

type FixationTransportTab = 'fixation' | 'transport';

const route = useRoute();
const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canVerifyFixation = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.FIXATION_VERIFY),
);
const canHandoverTransport = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.TRANSPORT_HANDOVER),
);

const activeTab = ref<FixationTransportTab>('fixation');

function resolveAvailableTab(preferredTab: FixationTransportTab): FixationTransportTab {
  if (preferredTab === 'transport' && canHandoverTransport.value) {
    return 'transport';
  }
  if (preferredTab === 'fixation' && canVerifyFixation.value) {
    return 'fixation';
  }
  return canHandoverTransport.value ? 'transport' : 'fixation';
}

function resolveRouteInitialTab(): FixationTransportTab {
  return route.query.tab === 'transport' ? 'transport' : 'fixation';
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
    <ElTabs v-model="activeTab">
      <ElTabPane
        v-if="canVerifyFixation"
        label="固定核对"
        name="fixation"
      >
        <FixationVerifyView embedded />
      </ElTabPane>
      <ElTabPane
        v-if="canHandoverTransport"
        label="转运交接"
        name="transport"
      >
        <TransportHandoverView embedded />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
