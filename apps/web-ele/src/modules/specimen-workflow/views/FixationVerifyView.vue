<script setup lang="ts">
import type {
  SpecimenRemovalItem,
  SpecimenRemovalSummary,
} from '../types/specimen-workflow';

import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElAlert, ElMessage, ElMessageBox, ElPagination } from 'element-plus';

import {
  confirmSpecimenRemoval,
  confirmSpecimenRemovalByIdentifier,
  getApplicationDetail,
  listPendingSpecimenRemovals,
} from '../api/specimen-workflow-service';
import FixationVerifyTable from '../components/FixationVerifyTable.vue';
import FixationVerifyWorkbenchPanel from '../components/FixationVerifyWorkbenchPanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);
const userStore = useUserStore();
const route = useRoute();
type QuickConfirmIdentifierType = 'BARCODE' | 'SPECIMEN_NO';
type FixationVerifyWorkbenchPanelRef = {
  focusQuickInput: (identifierType: QuickConfirmIdentifierType) => void;
};

const emptySummary: SpecimenRemovalSummary = {
  abnormalCount: 0,
  confirmedCount: 0,
  pendingCount: 0,
  totalCount: 0,
};

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const workbenchPanelRef = ref<FixationVerifyWorkbenchPanelRef | null>(null);
const barcodeQuickInput = ref('');
const specimenNoQuickInput = ref('');
const pendingItems = ref<SpecimenRemovalItem[]>([]);
const summary = ref<SpecimenRemovalSummary>({ ...emptySummary });
const total = ref(0);
const quickActionLoading = reactive({
  barcode: false,
  specimenNo: false,
});

let routeSyncToken = 0;

const filters = reactive({
  applicationNo: '',
  dateRange: [] as string[],
  departmentId: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const currentQuery = computed(() => ({
  applicationNo: filters.applicationNo.trim() || undefined,
  dateFrom: filters.dateRange[0] || undefined,
  dateTo: filters.dateRange[1] || undefined,
  departmentId: filters.departmentId.trim() || undefined,
  page: filters.page,
  size: filters.size,
}));

function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function canConfirmRemoval(row: SpecimenRemovalItem) {
  return !row.specimenRemovalAt;
}

function formatRemovalStatus(row: SpecimenRemovalItem) {
  return row.specimenRemovalAt ? '离体' : '未设置';
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.departmentId = department?.id ?? '';
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingSpecimenRemovals(currentQuery.value);
    pendingItems.value = result.items;
    summary.value = result.summary;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    pendingItems.value = [];
    summary.value = { ...emptySummary };
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
}

function handleReset() {
  filters.applicationNo = '';
  filters.dateRange = [];
  filters.departmentId = '';
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  void loadPendingData();
}

function resolveCurrentOperator() {
  return {
    operatorName: userStore.userInfo?.realName?.trim() ?? '',
    operatorUserId: userStore.userInfo?.userId?.trim() ?? '',
  };
}

async function resolveQuickConfirmIdentifierType(
  identifierType: QuickConfirmIdentifierType,
  identifier: string,
) {
  const normalizedIdentifier = identifier.trim();
  const currentMatches = pendingItems.value.filter(
    (item) =>
      item.barcode.trim() === normalizedIdentifier ||
      item.specimenNo.trim() === normalizedIdentifier,
  );

  const hasBarcodeMatch = currentMatches.some(
    (item) => item.barcode.trim() === normalizedIdentifier,
  );
  const hasSpecimenNoMatch = currentMatches.some(
    (item) => item.specimenNo.trim() === normalizedIdentifier,
  );

  if (hasBarcodeMatch && !hasSpecimenNoMatch) {
    return 'BARCODE' as const;
  }
  if (hasSpecimenNoMatch && !hasBarcodeMatch) {
    return 'SPECIMEN_NO' as const;
  }
  if (hasBarcodeMatch || hasSpecimenNoMatch) {
    return identifierType;
  }

  const lookupResult = await listPendingSpecimenRemovals({
    ...currentQuery.value,
    keyword: normalizedIdentifier,
    page: 1,
    size: 100,
  });
  const lookupMatches = lookupResult.items.filter(
    (item) =>
      item.barcode.trim() === normalizedIdentifier ||
      item.specimenNo.trim() === normalizedIdentifier,
  );
  const lookupHasBarcodeMatch = lookupMatches.some(
    (item) => item.barcode.trim() === normalizedIdentifier,
  );
  const lookupHasSpecimenNoMatch = lookupMatches.some(
    (item) => item.specimenNo.trim() === normalizedIdentifier,
  );

  if (lookupHasBarcodeMatch && !lookupHasSpecimenNoMatch) {
    return 'BARCODE' as const;
  }
  if (lookupHasSpecimenNoMatch && !lookupHasBarcodeMatch) {
    return 'SPECIMEN_NO' as const;
  }

  return identifierType;
}

function focusQuickInput(identifierType: QuickConfirmIdentifierType) {
  workbenchPanelRef.value?.focusQuickInput(identifierType);
}

async function submitQuickConfirm(identifierType: QuickConfirmIdentifierType) {
  const isBarcode = identifierType === 'BARCODE';
  const currentValue = isBarcode
    ? barcodeQuickInput.value
    : specimenNoQuickInput.value;
  const normalizedValue = currentValue.trim();
  const { operatorName, operatorUserId } = resolveCurrentOperator();

  if (!normalizedValue) {
    ElMessage.warning(isBarcode ? '请先输入标本ID' : '请先输入标本流水号');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  quickActionLoading.barcode = isBarcode;
  quickActionLoading.specimenNo = !isBarcode;
  pageError.value = '';
  try {
    const resolvedIdentifierType = await resolveQuickConfirmIdentifierType(
      identifierType,
      normalizedValue,
    );
    await confirmSpecimenRemovalByIdentifier({
      identifier: normalizedValue,
      identifierType: resolvedIdentifierType,
      operatorName,
      operatorUserId: operatorUserId || null,
      remarks: '离体确认',
    });

    if (isBarcode) {
      barcodeQuickInput.value = '';
      ElMessage.success(`条码 ${normalizedValue} 已完成离体确认`);
    } else {
      specimenNoQuickInput.value = '';
      ElMessage.success(`标本流水号 ${normalizedValue} 已完成离体确认`);
    }
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    quickActionLoading.barcode = false;
    quickActionLoading.specimenNo = false;
    await nextTick();
    focusQuickInput(identifierType);
  }
}

async function submitConfirmRemoval(row: SpecimenRemovalItem) {
  const specimenBarcode = row.barcode.trim();
  const { operatorName, operatorUserId } = resolveCurrentOperator();

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫描标本条码');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  try {
    await ElMessageBox.confirm('确认该标本已离体吗？', '离体确认', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
  } catch {
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await confirmSpecimenRemoval({
      operatorName,
      operatorUserId: operatorUserId || null,
      remarks: '离体确认',
      specimenBarcode,
    });
    ElMessage.success(`条码 ${specimenBarcode} 已完成离体确认`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function syncApplicationNoFromRoute() {
  const currentToken = ++routeSyncToken;
  const routeApplicationNo = normalizeRouteQueryValue(
    route.query.applicationNo,
  ).trim();
  const routeApplicationId = normalizeRouteQueryValue(
    route.query.applicationId,
  ).trim();
  let resolvedApplicationNo = routeApplicationNo;

  if (!resolvedApplicationNo && routeApplicationId) {
    try {
      const detail = await getApplicationDetail(routeApplicationId);
      if (currentToken !== routeSyncToken) {
        return;
      }
      resolvedApplicationNo = detail.applicationNo.trim();
    } catch {
      resolvedApplicationNo = '';
    }
  }

  if (currentToken !== routeSyncToken) {
    return;
  }

  filters.applicationNo = resolvedApplicationNo;
  filters.page = 1;
  await loadPendingData();
}

watch(
  () => [route.query.applicationNo, route.query.applicationId],
  () => {
    void syncApplicationNoFromRoute();
  },
  { immediate: true },
);
</script>

<template>
  <Page :title="embedded ? '' : '固定与转运'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="离体确认"
        description="支持按标本ID或标本流水号回车快速确认，也可按申请单号、送检科室和登记日期筛选标本后逐条确认。"
      >
        <FixationVerifyWorkbenchPanel
          ref="workbenchPanelRef"
          v-model:barcode-quick-input="barcodeQuickInput"
          v-model:filters="filters"
          v-model:specimen-no-quick-input="specimenNoQuickInput"
          :quick-action-loading="quickActionLoading"
          :summary="summary"
          @department-change="handleDepartmentChange"
          @quick-confirm="submitQuickConfirm"
          @reset="handleReset"
          @search="handleSearch"
        />

        <FixationVerifyTable
          :action-loading="actionLoading"
          :can-confirm-removal="canConfirmRemoval"
          :format-removal-status="formatRemovalStatus"
          :items="pendingItems"
          :loading="loading"
          :page="filters.page"
          :size="filters.size"
          @confirm-removal="submitConfirmRemoval"
        />

        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="filters.page"
            v-model:page-size="filters.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="loadPendingData"
            @size-change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
