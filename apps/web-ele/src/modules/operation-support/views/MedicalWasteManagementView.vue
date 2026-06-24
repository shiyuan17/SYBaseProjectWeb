<script setup lang="ts">
import type { MedicalWasteSpecimenOptionsView } from '../types/operation-support';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import { ElAlert, ElTabPane, ElTabs } from 'element-plus';

import { getMedicalWasteCapabilities } from '../access';
import { getMedicalWasteSpecimenOptions } from '../api/operation-support-service';
import MedicalWasteReagentTab from '../components/MedicalWasteReagentTab.vue';
import MedicalWasteSpecimenTab from '../components/MedicalWasteSpecimenTab.vue';
import { getOperationSupportPageErrorMessage } from '../utils/error';

const accessStore = useAccessStore();
const userStore = useUserStore();
const route = useRoute();

const capabilities = computed(() =>
  getMedicalWasteCapabilities(accessStore.accessCodes),
);
const activeTab = ref<'REAGENT' | 'SPECIMEN'>('SPECIMEN');
const loadedTabs = ref<Array<'REAGENT' | 'SPECIMEN'>>([]);
const pageError = ref('');
const options = ref<MedicalWasteSpecimenOptionsView>({
  grossingOperators: [],
  grossingPeriods: [],
  grossingStations: [],
});
const currentUserName = computed(
  () => userStore.userInfo?.realName?.trim() ?? '',
);

async function loadOptions() {
  if (!capabilities.value.canViewPage) {
    return;
  }
  try {
    options.value = await getMedicalWasteSpecimenOptions();
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  }
}

void loadOptions();

watch(
  activeTab,
  (tab) => {
    if (!loadedTabs.value.includes(tab)) {
      loadedTabs.value = [...loadedTabs.value, tab];
    }
  },
  { immediate: true },
);

function hasLoadedTab(tab: 'REAGENT' | 'SPECIMEN') {
  return loadedTabs.value.includes(tab);
}
</script>

<template>
  <div
    v-if="!capabilities.canViewPage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>
  <Page
    v-else
    :description="
      String(route.meta.description || '维护医疗废物袋打印与交接记录。')
    "
    :show-header="false"
    :title="String(route.meta.title || '医疗废物管理')"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <ElTabs v-model="activeTab" class="operation-support-tabs">
        <ElTabPane label="人体标本" name="SPECIMEN">
          <MedicalWasteSpecimenTab
            v-if="hasLoadedTab('SPECIMEN')"
            :can-view-page="capabilities.canViewPage"
            :options="options"
          />
        </ElTabPane>
        <ElTabPane label="药物试剂" name="REAGENT">
          <MedicalWasteReagentTab
            v-if="hasLoadedTab('REAGENT')"
            :current-user-name="currentUserName"
          />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
