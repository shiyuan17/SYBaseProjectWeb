<script setup lang="ts">
import type { SpecimenOutboundListItem } from '../types/specimen-workflow';

import { reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElInput,
  ElMessage,
  ElPagination,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  createTransportOrder,
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
  canSelectSpecimenOutboundRow,
  createDefaultTransportOutboundFormState,
  normalizeRouteQueryValue,
  resolveTransportSelectionValidationMessage,
  splitTransportRowsByTransportOrder,
} from '../utils/transport-handover';

const PATHOLOGY_DEPARTMENT_ID = 'DEPT_PATH';
const PATHOLOGY_DEPARTMENT_NAME = '病理科';

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
const selectedRows = ref<SpecimenOutboundListItem[]>([]);
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
  if (matchedRecord.outboundAt) {
    return;
  }
  if (!matchedRecord.transportOrderId) {
    await submitQuickOutboundBySpecimenNo(matchedRecord.specimenNo);
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
    selectedRows.value = [];
    total.value = result.total;
    if (options.autoSubmitQuickOutbound) {
      await maybeSubmitQuickOutbound(items.value);
    }
    return result;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    items.value = [];
    selectedRows.value = [];
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

function handleSelectionChange(rows: SpecimenOutboundListItem[]) {
  selectedRows.value = rows;
}

function handleOutboundUserChange(user: null | { id: string; name: string }) {
  outboundForm.outboundUserId = user?.id ?? '';
  outboundForm.outboundUserName = user?.name ?? '';
}

async function submitQuickOutbound(record: SpecimenOutboundListItem) {
  if (!ensureOutboundOperatorSelected()) {
    return;
  }
  if (!record.transportOrderId) {
    await submitQuickOutboundBySpecimenNo(record.specimenNo);
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

async function handleBatchTransport() {
  if (!ensureOutboundOperatorSelected()) {
    return;
  }

  const validationMessage = resolveTransportSelectionValidationMessage(
    selectedRows.value,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  const { existingTransportOrderIds, rowsWithoutTransportOrder } =
    splitTransportRowsByTransportOrder(selectedRows.value);
  const nextTransportOrderIds = [...existingTransportOrderIds];

  outboundLoading.value = true;
  pageError.value = '';
  try {
    if (rowsWithoutTransportOrder.length > 0) {
      const [referenceRow] = rowsWithoutTransportOrder;
      const specimenBarcodes = rowsWithoutTransportOrder
        .map((row) => row.barcode?.trim() ?? '')
        .filter(Boolean);

      if (
        !referenceRow ||
        specimenBarcodes.length !== rowsWithoutTransportOrder.length
      ) {
        ElMessage.warning('所选标本缺少条码，无法转运');
        return;
      }

      const createdOrder = await createTransportOrder({
        applicationId: referenceRow.applicationId,
        handoverDepartmentId:
          referenceRow.submittingDepartmentId?.trim() || null,
        handoverDepartmentName:
          referenceRow.submittingDepartmentName?.trim() || '-',
        handoverUserId: outboundForm.outboundUserId.trim() || null,
        handoverUserName: outboundForm.outboundUserName.trim(),
        receiverDepartmentId: PATHOLOGY_DEPARTMENT_ID,
        receiverDepartmentName: PATHOLOGY_DEPARTMENT_NAME,
        remarks: outboundForm.remarks.trim() || null,
        specimenBarcodes,
        terminalCode: outboundForm.terminalCode.trim() || null,
      });
      nextTransportOrderIds.push(createdOrder.id);
    }

    for (const transportOrderId of nextTransportOrderIds) {
      await outboundTransportOrder(
        transportOrderId,
        buildTransportOrderOutboundRequest(outboundForm),
      );
    }

    selectedRows.value = [];
    ElMessage.success('标本转运成功');
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
            <div>
              已选
              <span class="text-xl font-semibold text-primary">{{
                selectedRows.length
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
            <ElButton
              :disabled="
                selectedRows.length === 0 ||
                selectedRows.some((row) => !canSelectSpecimenOutboundRow(row))
              "
              type="primary"
              @click="handleBatchTransport"
            >
              转运
            </ElButton>
            <div
              v-if="outboundLoading"
              class="text-sm text-[color:var(--el-color-primary)]"
            >
              正在执行转运...
            </div>
          </div>

          <SpecimenOutboundTable
            :items="items"
            :loading="loading"
            :page="filters.page"
            :size="filters.size"
            @selection-change="handleSelectionChange"
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
