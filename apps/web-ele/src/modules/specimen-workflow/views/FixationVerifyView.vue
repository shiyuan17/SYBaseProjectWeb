<script setup lang="ts">
import type {
  SpecimenManagementListItem,
  SpecimenRemovalItem,
  SpecimenRemovalSummary,
} from '../types/specimen-workflow';
import type { RemovalDisplayRow } from '../utils/specimen-removal-display';

import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElAlert, ElMessage, ElMessageBox, ElPagination } from 'element-plus';

import {
  confirmSpecimenRemoval,
  confirmSpecimenRemovalByIdentifier,
  getApplicationDetail,
  listPendingSpecimenRemovals,
  listSpecimens,
} from '../api/specimen-workflow-service';
import FixationVerifyTable from '../components/FixationVerifyTable.vue';
import FixationVerifyWorkbenchPanel from '../components/FixationVerifyWorkbenchPanel.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  loadOperatingRoomNameMapSafely,
  normalizeOperatingRoomDisplayValue,
} from '../utils/operating-room-display';
import {
  canConfirmRemoval as canConfirmRemovalValue,
  mapSpecimenManagementItemToRemovalDisplayRow,
  toRemovalDisplayRow,
} from '../utils/specimen-removal-display';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);
const route = useRoute();
type QuickConfirmIdentifierType = 'BARCODE' | 'SPECIMEN_NO';
type FixationVerifyWorkbenchPanelRef = {
  focusQuickInput: () => void;
};
type QuickConfirmResolution =
  | {
      identifierType: QuickConfirmIdentifierType;
      matchedSpecimen: SpecimenManagementListItem;
      status: 'ready';
    }
  | {
      matchedSpecimen: SpecimenManagementListItem;
      status: 'already_removed';
    }
  | {
      status: 'multiple' | 'not_found';
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
const specimenIdQuickInput = ref('');
const pendingItemsSource = ref<RemovalDisplayRow[]>([]);
const pendingItems = ref<RemovalDisplayRow[]>([]);
const summary = ref<SpecimenRemovalSummary>({ ...emptySummary });
const total = ref(0);
const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());
const confirmedRemovalItemCache = reactive(
  new Map<string, RemovalDisplayRow>(),
);
const quickActionLoading = reactive({
  specimenId: false,
});

let routeSyncToken = 0;
const APPLICATION_EXPANSION_SIZE = 500;

const filters = reactive({
  applicationNo: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const currentQuery = computed(() => ({
  applicationNo: filters.applicationNo.trim() || undefined,
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

function canConfirmRemoval(row: RemovalDisplayRow) {
  return canConfirmRemovalValue(row);
}

function formatRemovalStatus(row: RemovalDisplayRow) {
  return row.specimenRemovalAt ? '离体' : '未设置';
}

function buildSummary(rows: RemovalDisplayRow[]): SpecimenRemovalSummary {
  return {
    abnormalCount: rows.filter((item) => item.abnormalFlag).length,
    confirmedCount: rows.filter((item) => Boolean(item.specimenRemovalAt))
      .length,
    pendingCount: rows.filter((item) => !item.specimenRemovalAt).length,
    totalCount: rows.length,
  };
}

function normalizeRemovalItem(row: SpecimenRemovalItem): RemovalDisplayRow {
  return {
    ...toRemovalDisplayRow(row),
    surgeryName: normalizeOperatingRoomDisplayValue(
      operatingRoomNameMap.value,
      row.surgeryName,
    ),
  };
}

async function ensureOperatingRoomNameMapLoaded() {
  if (operatingRoomNameMap.value.size > 0) {
    return operatingRoomNameMap.value;
  }

  operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
  return operatingRoomNameMap.value;
}

function normalizeApplicationRemovalItem(
  row: SpecimenManagementListItem,
): RemovalDisplayRow {
  return {
    ...mapSpecimenManagementItemToRemovalDisplayRow(row),
    surgeryName: normalizeOperatingRoomDisplayValue(
      operatingRoomNameMap.value,
      row.surgeryName,
    ),
  };
}

function mergeConfirmedRemovalItems(rows: RemovalDisplayRow[]) {
  const rowsBySpecimenId = new Set(rows.map((item) => item.specimenId));
  const mergedRows = rows.map(
    (item) => confirmedRemovalItemCache.get(item.specimenId) ?? item,
  );
  const currentApplicationNo = filters.applicationNo.trim();

  for (const confirmedItem of confirmedRemovalItemCache.values()) {
    if (
      currentApplicationNo &&
      confirmedItem.applicationNo === currentApplicationNo &&
      !rowsBySpecimenId.has(confirmedItem.specimenId)
    ) {
      mergedRows.push(confirmedItem);
    }
  }

  return mergedRows;
}

function syncVisibleRemovalItems(rows: RemovalDisplayRow[]) {
  pendingItemsSource.value = rows;
  pendingItems.value = mergeConfirmedRemovalItems(rows);
  summary.value = buildSummary(pendingItems.value);
  total.value = pendingItems.value.length;
}

function upsertConfirmedRemovalItem(item: RemovalDisplayRow) {
  confirmedRemovalItemCache.set(item.specimenId, item);
  pendingItems.value = mergeConfirmedRemovalItems(pendingItemsSource.value);
  summary.value = buildSummary(pendingItems.value);
  total.value = pendingItems.value.length;
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    await ensureOperatingRoomNameMapLoaded();
    const applicationNo = filters.applicationNo.trim();

    if (applicationNo) {
      const result = await listSpecimens({
        applicationNo,
        page: 1,
        size: APPLICATION_EXPANSION_SIZE,
      });
      syncVisibleRemovalItems(
        result.items.map((item) => normalizeApplicationRemovalItem(item)),
      );
      return;
    }

    const result = await listPendingSpecimenRemovals(currentQuery.value);
    syncVisibleRemovalItems(
      result.items.map((item) => normalizeRemovalItem(item)),
    );
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    pendingItemsSource.value = [];
    pendingItems.value = [];
    summary.value = { ...emptySummary };
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function resolveQuickConfirmExactMatch(
  items: SpecimenManagementListItem[],
  identifierType: QuickConfirmIdentifierType,
  identifier: string,
): QuickConfirmResolution {
  const normalizedIdentifier = identifier.trim();
  const exactMatches = items.filter(
    (item) =>
      (item.barcode ?? '').trim() === normalizedIdentifier ||
      item.specimenNo.trim() === normalizedIdentifier,
  );
  const barcodeMatches = exactMatches.filter(
    (item) => (item.barcode ?? '').trim() === normalizedIdentifier,
  );
  const specimenNoMatches = exactMatches.filter(
    (item) => item.specimenNo.trim() === normalizedIdentifier,
  );
  const hasBarcodeMatch = barcodeMatches.length > 0;
  const hasSpecimenNoMatch = specimenNoMatches.length > 0;
  let matchedSpecimen: null | SpecimenManagementListItem = null;
  let resolvedIdentifierType = identifierType;

  if (!hasBarcodeMatch && !hasSpecimenNoMatch) {
    return { status: 'not_found' };
  }

  if (hasBarcodeMatch && !hasSpecimenNoMatch && barcodeMatches.length === 1) {
    matchedSpecimen = barcodeMatches[0] ?? null;
    resolvedIdentifierType = 'BARCODE';
  } else if (
    hasSpecimenNoMatch &&
    !hasBarcodeMatch &&
    specimenNoMatches.length === 1
  ) {
    matchedSpecimen = specimenNoMatches[0] ?? null;
    resolvedIdentifierType = 'SPECIMEN_NO';
  } else if (exactMatches.length === 1) {
    matchedSpecimen = exactMatches[0] ?? null;
  }

  if (!matchedSpecimen) {
    return { status: 'multiple' };
  }
  if (matchedSpecimen.specimenRemovalAt) {
    return {
      matchedSpecimen,
      status: 'already_removed',
    };
  }

  return {
    identifierType: resolvedIdentifierType,
    matchedSpecimen,
    status: 'ready',
  };
}

async function resolveQuickConfirmTarget(
  identifierType: QuickConfirmIdentifierType,
  identifier: string,
) {
  const normalizedIdentifier = identifier.trim();
  const lookupResult = await listSpecimens({
    keyword: normalizedIdentifier,
    page: 1,
    size: 100,
  });
  return resolveQuickConfirmExactMatch(
    lookupResult.items,
    identifierType,
    identifier,
  );
}

function focusQuickInput() {
  workbenchPanelRef.value?.focusQuickInput();
}

async function syncQuickConfirmApplicationSpecimens(
  matchedSpecimen: SpecimenManagementListItem,
) {
  const applicationNo = matchedSpecimen.applicationNo.trim();

  if (!applicationNo) {
    return;
  }

  if (filters.applicationNo.trim() !== applicationNo) {
    filters.applicationNo = applicationNo;
  }

  await loadPendingData();
}

async function submitQuickConfirm() {
  const normalizedValue = specimenIdQuickInput.value.trim();

  if (!normalizedValue) {
    ElMessage.warning('请先输入标本ID');
    return;
  }

  quickActionLoading.specimenId = true;
  pageError.value = '';
  try {
    const quickConfirmTarget = await resolveQuickConfirmTarget(
      'SPECIMEN_NO',
      normalizedValue,
    );

    if (quickConfirmTarget.status !== 'ready') {
      if (quickConfirmTarget.status === 'already_removed') {
        await syncQuickConfirmApplicationSpecimens(
          quickConfirmTarget.matchedSpecimen,
        );
        ElMessage.warning(`标本ID ${normalizedValue} 已完成离体确认`);
        return;
      }
      if (quickConfirmTarget.status === 'not_found') {
        ElMessage.warning('未找到对应标本，请确认标本ID是否正确');
        return;
      }
      ElMessage.warning('标本ID对应多条记录，无法自动确认');
      return;
    }

    const readyTarget: Extract<QuickConfirmResolution, { status: 'ready' }> =
      quickConfirmTarget;

    const result = await confirmSpecimenRemovalByIdentifier({
      identifier: normalizedValue,
      identifierType: readyTarget.identifierType,
      remarks: '离体确认',
    });

    const sourceRow = normalizeApplicationRemovalItem(
      readyTarget.matchedSpecimen,
    );
    upsertConfirmedRemovalItem(
      toRemovalDisplayRow({
        ...sourceRow,
        confirmedAt: result.specimenRemovalAt,
        specimenRemovalAt: result.specimenRemovalAt,
        specimenRemovalOperatorName: result.operatorName,
      }),
    );
    if (
      sourceRow.applicationNo &&
      filters.applicationNo.trim() !== sourceRow.applicationNo
    ) {
      filters.applicationNo = sourceRow.applicationNo;
    }

    specimenIdQuickInput.value = '';
    ElMessage.success(`标本ID ${normalizedValue} 已完成离体确认`);
    await syncQuickConfirmApplicationSpecimens(readyTarget.matchedSpecimen);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    quickActionLoading.specimenId = false;
    await nextTick();
    focusQuickInput();
  }
}

async function submitConfirmRemoval(row: RemovalDisplayRow) {
  const specimenBarcode = row.barcode.trim();

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫描标本条码');
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
    const result = await confirmSpecimenRemoval({
      remarks: '离体确认',
      specimenBarcode,
    });
    upsertConfirmedRemovalItem(
      toRemovalDisplayRow({
        ...row,
        confirmedAt: result.specimenRemovalAt,
        specimenRemovalAt: result.specimenRemovalAt,
        specimenRemovalOperatorName: result.operatorName,
      }),
    );
    if (
      row.applicationNo &&
      filters.applicationNo.trim() !== row.applicationNo
    ) {
      filters.applicationNo = row.applicationNo;
      await loadPendingData();
    } else {
      pendingItems.value = mergeConfirmedRemovalItems(pendingItemsSource.value);
      summary.value = buildSummary(pendingItems.value);
      total.value = pendingItems.value.length;
    }
    ElMessage.success(`条码 ${specimenBarcode} 已完成离体确认`);
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
        description="支持按标本ID回车快速确认，并可在列表中逐条完成离体确认。"
      >
        <FixationVerifyWorkbenchPanel
          ref="workbenchPanelRef"
          v-model:specimen-id-quick-input="specimenIdQuickInput"
          :quick-action-loading="quickActionLoading"
          :summary="summary"
          @quick-confirm="submitQuickConfirm"
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
