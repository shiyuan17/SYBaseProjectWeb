<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  ApplicationDetailView,
  SpecimenManagementListItem,
  SpecimenRemovalSummary,
} from '../types/specimen-workflow';
import type { RemovalDisplayRow } from '../utils/specimen-removal-display';

import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElPagination,
} from 'element-plus';

import { lookupApplicationRegistrationWorkbenchRecord } from '../api/application-registration-workbench-service';
import {
  confirmSpecimenRemoval,
  confirmSpecimenRemovalByIdentifier,
  getApplicationDetail,
  listSpecimens,
} from '../api/specimen-workflow-service';
import FixationVerifyTable from '../components/FixationVerifyTable.vue';
import FixationVerifyWorkbenchPanel from '../components/FixationVerifyWorkbenchPanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  loadOperatingRoomNameMapSafely,
  normalizeOperatingRoomDisplayValue,
} from '../utils/operating-room-display';
import { resolveWorkflowPatientInfo } from '../utils/patient-info';
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
type RemovalApplicationContext = {
  applicationDetail: ApplicationDetailView;
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
const selectedRemovalRows = ref<RemovalDisplayRow[]>([]);
const summary = ref<SpecimenRemovalSummary>({ ...emptySummary });
const total = ref(0);
const operatingRoomNameMap = ref<ReadonlyMap<string, string>>(new Map());
const applicationContextCache = reactive(
  new Map<string, null | RemovalApplicationContext>(),
);
const confirmedRemovalItemCache = reactive(
  new Map<string, RemovalDisplayRow>(),
);
const workbenchRecordCache = reactive(
  new Map<string, ApplicationRegistrationWorkbenchRecord | null>(),
);
const quickActionLoading = reactive({
  specimenId: false,
});
const selectedActionableRemovalCount = computed(
  () =>
    selectedRemovalRows.value.filter((row) => canConfirmRemoval(row)).length,
);

let routeSyncToken = 0;
const APPLICATION_EXPANSION_SIZE = 500;

const filters = reactive({
  applicationNo: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

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

async function ensureOperatingRoomNameMapLoaded() {
  if (operatingRoomNameMap.value.size > 0) {
    return operatingRoomNameMap.value;
  }

  operatingRoomNameMap.value = await loadOperatingRoomNameMapSafely();
  return operatingRoomNameMap.value;
}

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

async function ensureApplicationContext(applicationId: string) {
  const normalizedApplicationId = normalizeText(applicationId);
  if (!normalizedApplicationId) {
    return null;
  }
  if (applicationContextCache.has(normalizedApplicationId)) {
    return applicationContextCache.get(normalizedApplicationId) ?? null;
  }

  try {
    const applicationDetail = await getApplicationDetail(
      normalizedApplicationId,
    );
    const context = { applicationDetail };
    applicationContextCache.set(normalizedApplicationId, context);
    return context;
  } catch {
    applicationContextCache.set(normalizedApplicationId, null);
    return null;
  }
}

async function ensureWorkbenchRecord(applicationNo: string) {
  const normalizedApplicationNo = normalizeText(applicationNo);
  if (!normalizedApplicationNo) {
    return null;
  }
  if (workbenchRecordCache.has(normalizedApplicationNo)) {
    return workbenchRecordCache.get(normalizedApplicationNo) ?? null;
  }

  try {
    const record = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: normalizedApplicationNo,
      queryType: 'APPLICATION_NO',
    });
    workbenchRecordCache.set(normalizedApplicationNo, record);
    return record;
  } catch {
    workbenchRecordCache.set(normalizedApplicationNo, null);
    return null;
  }
}

async function normalizeApplicationRemovalItem(
  row: SpecimenManagementListItem,
): Promise<RemovalDisplayRow> {
  const [applicationContext, workbenchRecord] = await Promise.all([
    ensureApplicationContext(row.applicationId),
    ensureWorkbenchRecord(row.applicationNo),
  ]);
  const patientInfo = resolveWorkflowPatientInfo(row, {
    applicationDetail: applicationContext?.applicationDetail ?? null,
    patientGender: applicationContext?.applicationDetail.patientGender ?? null,
    patientId: applicationContext?.applicationDetail.patientId ?? null,
    workbenchRecord,
  });

  return {
    ...mapSpecimenManagementItemToRemovalDisplayRow(row),
    inpatientNo: patientInfo.inpatientNo,
    patientIdLabel: patientInfo.patientIdLabel,
    surgeryName: normalizeOperatingRoomDisplayValue(
      operatingRoomNameMap.value,
      row.surgeryName,
    ),
    wardName: patientInfo.wardName,
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

function mergeRemovalRowsBySpecimenId(
  currentRows: RemovalDisplayRow[],
  incomingRows: RemovalDisplayRow[],
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

function syncVisibleRemovalItems(rows: RemovalDisplayRow[]) {
  pendingItemsSource.value = mergeRemovalRowsBySpecimenId(
    pendingItemsSource.value,
    rows,
  );
  pendingItems.value = mergeConfirmedRemovalItems(pendingItemsSource.value);
  selectedRemovalRows.value = selectedRemovalRows.value.filter((selectedRow) =>
    pendingItems.value.some(
      (item) => item.specimenId === selectedRow.specimenId,
    ),
  );
  summary.value = buildSummary(pendingItems.value);
  total.value = pendingItems.value.length;
}

function clearVisibleRemovalItems() {
  pendingItemsSource.value = [];
  pendingItems.value = [];
  selectedRemovalRows.value = [];
  summary.value = { ...emptySummary };
  total.value = 0;
  confirmedRemovalItemCache.clear();
  ElMessage.success('列表已清空');
}

function upsertConfirmedRemovalItem(item: RemovalDisplayRow) {
  confirmedRemovalItemCache.set(item.specimenId, item);
  pendingItems.value = mergeConfirmedRemovalItems(pendingItemsSource.value);
  selectedRemovalRows.value = selectedRemovalRows.value
    .map((selectedRow) =>
      selectedRow.specimenId === item.specimenId ? item : selectedRow,
    )
    .filter((selectedRow) =>
      pendingItems.value.some(
        (row) => row.specimenId === selectedRow.specimenId,
      ),
    );
  summary.value = buildSummary(pendingItems.value);
  total.value = pendingItems.value.length;
}

async function loadPendingData() {
  const applicationNo = filters.applicationNo.trim();
  if (!applicationNo) {
    pendingItemsSource.value = [];
    pendingItems.value = [];
    selectedRemovalRows.value = [];
    summary.value = { ...emptySummary };
    total.value = 0;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    await ensureOperatingRoomNameMapLoaded();
    const result = await listSpecimens({
      applicationNo,
      page: 1,
      size: APPLICATION_EXPANSION_SIZE,
    });
    syncVisibleRemovalItems(
      await Promise.all(
        result.items.map((item) => normalizeApplicationRemovalItem(item)),
      ),
    );
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    pendingItemsSource.value = [];
    pendingItems.value = [];
    selectedRemovalRows.value = [];
    summary.value = { ...emptySummary };
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(rows: RemovalDisplayRow[]) {
  selectedRemovalRows.value = rows;
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

  filters.applicationNo = applicationNo;
  await loadPendingData();
}

async function submitQuickConfirm() {
  const normalizedValue = specimenIdQuickInput.value.trim();

  if (!normalizedValue) {
    ElMessage.warning('请先输入标本条码/编号');
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
        ElMessage.warning(`标本 ${normalizedValue} 已完成离体确认`);
        return;
      }
      if (quickConfirmTarget.status === 'not_found') {
        ElMessage.warning('未找到对应标本，请确认标本条码/编号是否正确');
        return;
      }
      ElMessage.warning('标本条码/编号对应多条记录，无法自动确认');
      return;
    }

    const readyTarget: Extract<QuickConfirmResolution, { status: 'ready' }> =
      quickConfirmTarget;

    const result = await confirmSpecimenRemovalByIdentifier({
      identifier: normalizedValue,
      identifierType: readyTarget.identifierType,
      remarks: '离体确认',
    });

    const sourceRow = await normalizeApplicationRemovalItem(
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
    specimenIdQuickInput.value = '';
    ElMessage.success(`标本 ${normalizedValue} 已完成离体确认`);
    await syncQuickConfirmApplicationSpecimens(readyTarget.matchedSpecimen);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    quickActionLoading.specimenId = false;
    await nextTick();
    focusQuickInput();
  }
}

async function confirmRemovalRow(row: RemovalDisplayRow) {
  const specimenBarcode = row.barcode?.trim() ?? '';
  const specimenNo = row.specimenNo.trim();
  return specimenBarcode
    ? confirmSpecimenRemoval({
        remarks: '离体确认',
        specimenBarcode,
      })
    : confirmSpecimenRemovalByIdentifier({
        identifier: specimenNo,
        identifierType: 'SPECIMEN_NO',
        remarks: '离体确认',
      });
}

async function submitBatchConfirmRemoval() {
  const actionableRows = selectedRemovalRows.value.filter((row) =>
    canConfirmRemoval(row),
  );

  if (actionableRows.length === 0) {
    ElMessage.warning('请先选择待离体确认的标本');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认选中的 ${actionableRows.length} 条标本已离体吗？`,
      '离体确认',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确认',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  actionLoading.value = true;
  pageError.value = '';

  try {
    for (const row of actionableRows) {
      const result = await confirmRemovalRow(row);

      upsertConfirmedRemovalItem(
        toRemovalDisplayRow({
          ...row,
          confirmedAt: result.specimenRemovalAt,
          patientIdLabel: row.patientIdLabel,
          specimenRemovalAt: result.specimenRemovalAt,
          specimenRemovalOperatorName: result.operatorName,
        }),
      );
    }

    ElMessage.success(`已完成 ${actionableRows.length} 条标本离体确认`);
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

  if (!resolvedApplicationNo) {
    filters.applicationNo = '';
    filters.page = 1;
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
  <Page :show-header="false" :title="embedded ? '' : '固定与转运'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <FixationVerifyWorkbenchPanel
        ref="workbenchPanelRef"
        v-model:specimen-id-quick-input="specimenIdQuickInput"
        :quick-action-loading="quickActionLoading"
        :summary="summary"
        @quick-confirm="submitQuickConfirm"
      >
        <template #actions>
          <ElButton
            :disabled="selectedActionableRemovalCount === 0"
            :loading="actionLoading"
            type="primary"
            @click="submitBatchConfirmRemoval"
          >
            离体确认
          </ElButton>
          <ElButton @click="clearVisibleRemovalItems">清除列表</ElButton>
        </template>
      </FixationVerifyWorkbenchPanel>

      <FixationVerifyTable
        :action-loading="actionLoading"
        :can-confirm-removal="canConfirmRemoval"
        :format-removal-status="formatRemovalStatus"
        :items="pendingItems"
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
          @current-change="loadPendingData"
          @size-change="loadPendingData"
        />
      </div>
    </div>
  </Page>
</template>
