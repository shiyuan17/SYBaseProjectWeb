<script setup lang="ts">
import type { SpecimenOutboundListItem } from '../types/specimen-workflow';
import type { SpecimenOutboundDisplayItem } from '../utils/transport-handover';

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
} from '../api/specimen-workflow-service';
import SpecimenOutboundTable from '../components/SpecimenOutboundTable.vue';
import { useOperatorVerificationPrompt } from '../composables/useOperatorVerificationPrompt';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  loadOperatingRoomNameMapSafely,
  normalizeOperatingRoomDisplayValue,
} from '../utils/operating-room-display';
import {
  buildTransportOrderOutboundRequest,
  createDefaultTransportOutboundFormState,
  enhanceSpecimenOutboundItem,
  normalizeRouteQueryValue,
  resolveExactSpecimenOutboundMatches,
  resolveTransportSelectionValidationMessage,
  splitTransportRowsByTransportOrder,
} from '../utils/transport-handover';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const PATHOLOGY_DEPARTMENT_ID = 'DEPT_PATH';
const PATHOLOGY_DEPARTMENT_NAME = '病理科';

const route = useRoute();
const userStore = useUserStore();
const { verifyOperator } = useOperatorVerificationPrompt();

const pageError = ref('');
const loading = ref(false);
const outboundLoading = ref(false);
const items = ref<SpecimenOutboundDisplayItem[]>([]);
const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());
const pendingOutboundIds = ref<string[]>([]);
const selectedRows = ref<SpecimenOutboundDisplayItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationId: '',
  identifier: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const outboundForm = reactive(
  createDefaultTransportOutboundFormState(
    userStore.userInfo?.realName ?? '',
    userStore.userInfo?.userId ?? '',
    (userStore.userInfo as undefined | { loginName?: string })?.loginName ?? '',
  ),
);

function buildListQuery() {
  return {
    applicationId: filters.applicationId.trim() || undefined,
    identifier: filters.identifier.trim() || undefined,
    page: filters.page,
    size: filters.size,
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

function applyDraftOutboundStatus(record: SpecimenOutboundDisplayItem) {
  if (!pendingOutboundIds.value.includes(record.specimenId)) {
    return record;
  }
  return {
    ...record,
    displayOutboundStatus: '出库未保存',
    outboundDraft: true,
    outboundStatusTagType: 'warning' as const,
  };
}

function markSubmittedRowsAsOutbound(submittedIds: Set<string>) {
  const outboundAt = new Date().toISOString();
  items.value = items.value.map((item) => {
    if (!submittedIds.has(item.specimenId)) {
      return applyDraftOutboundStatus(item);
    }
    return enhanceSpecimenOutboundItem({
      ...item,
      outboundAt: item.outboundAt ?? outboundAt,
      outboundUserName:
        outboundForm.outboundUserName.trim() || item.outboundUserName,
      specimenStatus: 'IN_TRANSIT',
    });
  });
  total.value = items.value.length;
}

function mergeOutboundRowsBySpecimenId(
  currentRows: SpecimenOutboundDisplayItem[],
  incomingRows: SpecimenOutboundDisplayItem[],
) {
  const nextRows = [...currentRows];
  for (const row of incomingRows) {
    const existingIndex = nextRows.findIndex(
      (item) => item.specimenId === row.specimenId,
    );
    if (existingIndex === -1) {
      nextRows.push(row);
      continue;
    }
    nextRows.splice(existingIndex, 1, {
      ...nextRows[existingIndex],
      ...row,
    });
  }
  return nextRows;
}

async function ensureOperatingRoomNameMapLoaded() {
  if (operatingRoomNameMap.value.size > 0) {
    return operatingRoomNameMap.value;
  }

  operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
  return operatingRoomNameMap.value;
}

function maybeMarkQuickOutbound(records: SpecimenOutboundDisplayItem[]) {
  const identifier = filters.identifier.trim();
  if (!identifier) {
    return;
  }
  if (records.length === 0) {
    ElMessage.warning(`未找到可出库标本：${identifier}`);
    return;
  }
  const exactMatches = resolveExactSpecimenOutboundMatches(records, identifier);
  if (exactMatches.length !== 1) {
    return;
  }

  const matchedRecord = exactMatches[0];
  if (!matchedRecord) {
    return;
  }
  if (!matchedRecord.canOutbound) {
    ElMessage.warning(
      matchedRecord.outboundDisabledReason || '当前标本暂不能出库',
    );
    return;
  }
  if (!pendingOutboundIds.value.includes(matchedRecord.specimenId)) {
    pendingOutboundIds.value = [
      matchedRecord.specimenId,
      ...pendingOutboundIds.value,
    ];
  }
  items.value = items.value.map((item) => applyDraftOutboundStatus(item));
  filters.identifier = '';
  ElMessage.success('已加入出库未保存');
}

async function loadOutbounds(
  options: { autoSubmitQuickOutbound?: boolean } = {},
) {
  const hasExplicitCondition =
    Boolean(filters.applicationId.trim()) || Boolean(filters.identifier.trim());
  if (!hasExplicitCondition) {
    items.value = [];
    selectedRows.value = [];
    pendingOutboundIds.value = [];
    total.value = 0;
    return null;
  }

  loading.value = true;
  pageError.value = '';
  try {
    await ensureOperatingRoomNameMapLoaded();
    const result = await listSpecimenOutbounds(buildListQuery());
    const incomingItems = normalizeOutboundItems(result.items).map((record) =>
      applyDraftOutboundStatus(enhanceSpecimenOutboundItem(record)),
    );
    items.value = mergeOutboundRowsBySpecimenId(items.value, incomingItems).map(
      (item) => applyDraftOutboundStatus(item),
    );
    selectedRows.value = [];
    total.value = items.value.length;
    if (options.autoSubmitQuickOutbound) {
      maybeMarkQuickOutbound(incomingItems);
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

function handleIdentifierQuickSearch() {
  filters.page = 1;
  void loadOutbounds({ autoSubmitQuickOutbound: true });
}

function handleClearList() {
  items.value = [];
  selectedRows.value = [];
  pendingOutboundIds.value = [];
  total.value = 0;
  ElMessage.success('列表已清空');
}

function handlePageChange() {
  void loadOutbounds();
}

function handleSearch() {
  filters.page = 1;
  void loadOutbounds();
}

function handleSelectionChange(rows: SpecimenOutboundDisplayItem[]) {
  selectedRows.value = rows;
}

function handleOutboundUserChange(
  user: null | { id: string; loginName?: string; name: string },
) {
  outboundForm.outboundUserId = user?.id ?? '';
  outboundForm.outboundUserName = user?.name ?? '';
  outboundForm.loginName = user?.loginName ?? '';
}

function resolveSelectedOutboundOperator() {
  if (
    !outboundForm.outboundUserId.trim() ||
    !outboundForm.outboundUserName.trim()
  ) {
    ElMessage.warning('请选择操作人');
    return null;
  }
  return {
    id: outboundForm.outboundUserId.trim(),
    loginName: outboundForm.loginName.trim(),
    name: outboundForm.outboundUserName.trim(),
  };
}

function isCurrentOutboundUserSelected() {
  return outboundForm.outboundUserId.trim() === userStore.userInfo?.userId;
}

async function resolveOutboundOperatorVerificationToken(selectedOperator: {
  id: string;
  loginName: string;
  name: string;
}) {
  if (isCurrentOutboundUserSelected()) {
    return undefined;
  }
  return verifyOperator(selectedOperator);
}

async function handleBatchTransport() {
  const targetRows =
    selectedRows.value.length > 0
      ? selectedRows.value
      : items.value.filter((row) =>
          pendingOutboundIds.value.includes(row.specimenId),
        );

  const validationMessage =
    resolveTransportSelectionValidationMessage(targetRows);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  const selectedOperator = resolveSelectedOutboundOperator();
  if (!selectedOperator) {
    return;
  }
  const operatorVerificationToken =
    await resolveOutboundOperatorVerificationToken(selectedOperator);
  if (!operatorVerificationToken && !isCurrentOutboundUserSelected()) {
    return;
  }

  const { existingTransportOrderIds, rowsWithoutTransportOrder } =
    splitTransportRowsByTransportOrder(targetRows);
  const nextTransportOrderIds = [...existingTransportOrderIds];

  outboundLoading.value = true;
  pageError.value = '';
  try {
    if (rowsWithoutTransportOrder.length > 0) {
      const [referenceRow] = rowsWithoutTransportOrder;
      const specimenIds = rowsWithoutTransportOrder
        .map((row) => row.specimenId.trim())
        .filter(Boolean);
      const specimenBarcodes = rowsWithoutTransportOrder
        .map((row) => row.barcode?.trim() ?? '')
        .filter(Boolean);

      if (
        !referenceRow ||
        specimenIds.length !== rowsWithoutTransportOrder.length
      ) {
        ElMessage.warning('所选标本缺少标本 ID，无法转运');
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
        ...(operatorVerificationToken ? { operatorVerificationToken } : {}),
        remarks: outboundForm.remarks.trim() || null,
        specimenBarcodes,
        specimenIds,
        terminalCode: outboundForm.terminalCode.trim() || null,
      });
      nextTransportOrderIds.push(createdOrder.id);
    }

    for (const transportOrderId of nextTransportOrderIds) {
      await outboundTransportOrder(transportOrderId, {
        ...buildTransportOrderOutboundRequest(outboundForm),
        ...(operatorVerificationToken ? { operatorVerificationToken } : {}),
      });
    }

    const submittedIds = new Set(targetRows.map((row) => row.specimenId));
    pendingOutboundIds.value = pendingOutboundIds.value.filter(
      (id) => !submittedIds.has(id),
    );
    markSubmittedRowsAsOutbound(submittedIds);
    selectedRows.value = [];
    ElMessage.success('标本转运成功');
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
    if (filters.applicationId) {
      void loadOutbounds();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page :show-header="false" :title="embedded ? '' : '标本出库'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <div>
          全部
          <span class="text-xl font-semibold text-primary">{{ total }}</span>
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
          v-model="filters.identifier"
          clearable
          placeholder="请输入标本条码/编号"
          style="width: 220px"
          @keyup.enter="handleIdentifierQuickSearch"
        />
        <div class="w-[180px]">
          <SystemUserSelect
            v-model="outboundForm.outboundUserId"
            :selected-label="outboundForm.outboundUserName"
            placeholder="选择出库人"
            @change="handleOutboundUserChange"
          />
        </div>
        <ElButton :loading="loading" type="primary" @click="handleSearch">
          查询
        </ElButton>
        <ElButton
          :disabled="
            selectedRows.length > 0
              ? selectedRows.some((row) => !row.canOutbound)
              : pendingOutboundIds.length === 0
          "
          type="primary"
          @click="handleBatchTransport"
        >
          转运
        </ElButton>
        <ElButton @click="handleClearList">清除列表</ElButton>
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

      <div class="flex justify-end">
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
  </Page>
</template>
