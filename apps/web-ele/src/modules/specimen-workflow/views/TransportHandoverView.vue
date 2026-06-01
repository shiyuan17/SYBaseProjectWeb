<script setup lang="ts">
import type { SpecimenOutboundListItem } from '../types/specimen-workflow';

import { reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElInput,
  ElMessage,
  ElPagination,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  listSpecimenOutbounds,
  outboundTransportOrder,
  quickOutboundSpecimen,
} from '../api/specimen-workflow-service';
import SpecimenOutboundTable from '../components/SpecimenOutboundTable.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  loadOperatingRoomNameMapSafely,
  normalizeOperatingRoomDisplayValue,
} from '../utils/operating-room-display';
import {
  buildTransportOrderOutboundRequest,
  createDefaultTransportOutboundFormState,
  normalizeRouteQueryValue,
} from '../utils/transport-handover';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const route = useRoute();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const outboundLoading = ref(false);
const items = ref<SpecimenOutboundListItem[]>([]);
const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());
const total = ref(0);

const filters = reactive({
  applicationId: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  specimenNo: '',
});

const outboundForm = reactive(
  createDefaultTransportOutboundFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
  ),
);

function buildListQuery() {
  return {
    applicationId: filters.applicationId.trim() || undefined,
    page: filters.page,
    size: filters.size,
    specimenNo: filters.specimenNo.trim() || undefined,
  };
}

function normalizeOutboundItems(records: SpecimenOutboundListItem[]) {
  return records.map((record) => ({
    ...record,
    surgeryName: normalizeOperatingRoomDisplayValue(
      operatingRoomNameMap.value,
      record.surgeryName,
    ),
  }));
}

async function ensureOperatingRoomNameMapLoaded() {
  if (operatingRoomNameMap.value.size > 0) {
    return operatingRoomNameMap.value;
  }

  operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
  return operatingRoomNameMap.value;
}

async function maybeSubmitQuickOutbound(records: SpecimenOutboundListItem[]) {
  const specimenNo = filters.specimenNo.trim();
  if (!specimenNo) {
    return;
  }
  if (records.length === 0) {
    await submitQuickOutboundBySpecimenNo(specimenNo);
    return;
  }
  if (records.length !== 1) {
    return;
  }

  const matchedRecord = records[0];
  if (!matchedRecord) {
    return;
  }
  if (!matchedRecord.transportOrderId || matchedRecord.outboundAt) {
    return;
  }

  await submitQuickOutbound(matchedRecord);
}

async function loadOutbounds(options: { autoSubmitQuickOutbound?: boolean } = {}) {
  loading.value = true;
  pageError.value = '';
  try {
    await ensureOperatingRoomNameMapLoaded();
    const result = await listSpecimenOutbounds(buildListQuery());
    items.value = normalizeOutboundItems(result.items);
    total.value = result.total;
    if (options.autoSubmitQuickOutbound) {
      await maybeSubmitQuickOutbound(items.value);
    }
    return result;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    items.value = [];
    total.value = 0;
    return null;
  } finally {
    loading.value = false;
  }
}

function handleSpecimenNoQuickSearch() {
  filters.page = 1;
  void loadOutbounds({ autoSubmitQuickOutbound: true });
}

function handlePageChange() {
  void loadOutbounds();
}

function handleOutboundUserChange(user: null | { id: string; name: string }) {
  outboundForm.outboundUserId = user?.id ?? '';
  outboundForm.outboundUserName = user?.name ?? '';
}

async function submitQuickOutbound(record: SpecimenOutboundListItem) {
  if (!ensureOutboundOperatorSelected()) {
    return;
  }

  outboundLoading.value = true;
  pageError.value = '';
  try {
    await outboundTransportOrder(
      record.transportOrderId,
      buildTransportOrderOutboundRequest(outboundForm),
    );
    filters.specimenNo = '';
    ElMessage.success('标本出库成功');
    await loadOutbounds();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    outboundLoading.value = false;
  }
}

function ensureOutboundOperatorSelected() {
  if (
    !outboundForm.outboundUserId.trim() ||
    !outboundForm.outboundUserName.trim()
  ) {
    ElMessage.warning('请选择出库人');
    return false;
  }
  return true;
}

async function submitQuickOutboundBySpecimenNo(specimenNo: string) {
  if (!ensureOutboundOperatorSelected()) {
    return;
  }

  outboundLoading.value = true;
  pageError.value = '';
  try {
    await quickOutboundSpecimen({
      identifier: specimenNo,
      identifierType: 'SPECIMEN_NO',
      ...buildTransportOrderOutboundRequest(outboundForm),
    });
    filters.specimenNo = '';
    ElMessage.success('标本出库成功');
    await loadOutbounds();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    outboundLoading.value = false;
  }
}

watch(
  () => route.query.applicationId,
  (applicationIdValue) => {
    filters.applicationId = normalizeRouteQueryValue(applicationIdValue).trim();
    filters.page = 1;
    void loadOutbounds();
  },
  { immediate: true },
);
</script>

<template>
  <Page :title="embedded ? '' : '标本出库'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard title="标本出库">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <div>
              全部
              <span class="text-xl font-semibold text-primary">{{
                total
              }}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <ElInput
              v-model="filters.specimenNo"
              clearable
              placeholder="请输入标本流水号"
              style="width: 220px"
              @keyup.enter="handleSpecimenNoQuickSearch"
            />
            <div class="w-[180px]">
              <SystemUserSelect
                v-model="outboundForm.outboundUserId"
                :selected-label="outboundForm.outboundUserName"
                placeholder="选择出库人"
                @change="handleOutboundUserChange"
              />
            </div>
            <div
              v-if="outboundLoading"
              class="text-sm text-[color:var(--el-color-primary)]"
            >
              正在执行出库...
            </div>
          </div>

          <SpecimenOutboundTable
            :items="items"
            :loading="loading"
            :page="filters.page"
            :size="filters.size"
          />

          <div class="mt-4 flex justify-end">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @current-change="handlePageChange"
              @size-change="handlePageChange"
            />
          </div>
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
