<script setup lang="ts">
import type {
  SpecimenRemovalItem,
  SpecimenRemovalSummary,
} from '../types/specimen-workflow';

import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  confirmSpecimenRemovalByIdentifier,
  confirmSpecimenRemoval,
  getApplicationDetail,
  listPendingSpecimenRemovals,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

const userStore = useUserStore();
const route = useRoute();
type QuickInputRef = InstanceType<typeof ElInput> & {
  input?: HTMLInputElement | null;
};

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const emptySummary: SpecimenRemovalSummary = {
  abnormalCount: 0,
  confirmedCount: 0,
  pendingCount: 0,
  totalCount: 0,
};

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const barcodeQuickInput = ref('');
const specimenNoQuickInput = ref('');
const barcodeQuickInputContainerRef = ref<HTMLDivElement | null>(null);
const specimenNoQuickInputContainerRef = ref<HTMLDivElement | null>(null);
const barcodeQuickInputRef = ref<null | QuickInputRef>(null);
const specimenNoQuickInputRef = ref<null | QuickInputRef>(null);
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

function handleDepartmentChange(department: null | { id: string; name: string }) {
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

type QuickConfirmIdentifierType = 'BARCODE' | 'SPECIMEN_NO';

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
  const currentMatches = pendingItems.value.filter((item) =>
    item.barcode.trim() === normalizedIdentifier
    || item.specimenNo.trim() === normalizedIdentifier);

  const hasBarcodeMatch = currentMatches.some((item) => item.barcode.trim() === normalizedIdentifier);
  const hasSpecimenNoMatch = currentMatches.some((item) => item.specimenNo.trim() === normalizedIdentifier);

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
  const lookupMatches = lookupResult.items.filter((item) =>
    item.barcode.trim() === normalizedIdentifier
    || item.specimenNo.trim() === normalizedIdentifier);
  const lookupHasBarcodeMatch = lookupMatches.some((item) => item.barcode.trim() === normalizedIdentifier);
  const lookupHasSpecimenNoMatch = lookupMatches.some((item) => item.specimenNo.trim() === normalizedIdentifier);

  if (lookupHasBarcodeMatch && !lookupHasSpecimenNoMatch) {
    return 'BARCODE' as const;
  }
  if (lookupHasSpecimenNoMatch && !lookupHasBarcodeMatch) {
    return 'SPECIMEN_NO' as const;
  }

  return identifierType;
}

function focusQuickInput(identifierType: QuickConfirmIdentifierType) {
  const inputRef = identifierType === 'BARCODE'
    ? barcodeQuickInputRef.value
    : specimenNoQuickInputRef.value;
  const containerRef = identifierType === 'BARCODE'
    ? barcodeQuickInputContainerRef.value
    : specimenNoQuickInputContainerRef.value;
  const nativeInput = containerRef?.querySelector('input');
  nativeInput?.focus();
  if (nativeInput !== document.activeElement) {
    inputRef?.input?.focus();
  }
  if (nativeInput !== document.activeElement && inputRef?.input !== document.activeElement) {
    inputRef?.focus();
  }
}

async function submitQuickConfirm(identifierType: QuickConfirmIdentifierType) {
  const isBarcode = identifierType === 'BARCODE';
  const currentValue = isBarcode ? barcodeQuickInput.value : specimenNoQuickInput.value;
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
    const resolvedIdentifierType = await resolveQuickConfirmIdentifierType(identifierType, normalizedValue);
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
  const routeApplicationNo = normalizeRouteQueryValue(route.query.applicationNo).trim();
  const routeApplicationId = normalizeRouteQueryValue(route.query.applicationId).trim();
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
        <div class="mb-4 flex flex-wrap items-center gap-4 text-sm">
          <div class="font-semibold text-[color:#d6453d]">设置离体时间</div>
          <div>全部 <span class="text-xl font-semibold text-primary">{{ summary.totalCount }}</span></div>
          <div>已离体 <span class="text-xl font-semibold text-success">{{ summary.confirmedCount }}</span></div>
          <div>未设置 <span class="text-xl font-semibold text-danger">{{ summary.pendingCount }}</span></div>
        </div>

        <div class="mb-4 grid gap-3 rounded-lg border border-[color:#dbe3f0] bg-[color:#f7f9fc] p-4 md:grid-cols-2">
          <div
            ref="barcodeQuickInputContainerRef"
            v-loading="quickActionLoading.barcode"
            class="flex items-center gap-3"
          >
            <div class="min-w-20 text-sm font-medium text-[color:#1f2d3d]">标本ID</div>
            <ElInput
              ref="barcodeQuickInputRef"
              v-model="barcodeQuickInput"
              clearable
              placeholder="请输入标本ID后按回车确认"
              @keyup.enter="submitQuickConfirm('BARCODE')"
            />
          </div>
          <div
            ref="specimenNoQuickInputContainerRef"
            v-loading="quickActionLoading.specimenNo"
            class="flex items-center gap-3"
          >
            <div class="min-w-24 text-sm font-medium text-[color:#1f2d3d]">标本流水号</div>
            <ElInput
              ref="specimenNoQuickInputRef"
              v-model="specimenNoQuickInput"
              clearable
              placeholder="请输入标本流水号后按回车确认"
              @keyup.enter="submitQuickConfirm('SPECIMEN_NO')"
            />
          </div>
        </div>

        <ElForm inline label-width="88px">
          <ElFormItem label="申请单号">
            <ElInput
              v-model="filters.applicationNo"
              clearable
              placeholder="请输入申请单号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.departmentId"
              placeholder="请选择送检科室"
              @change="handleDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="登记日期">
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>

        <ElTable v-loading="loading" :data="pendingItems" border>
          <ElTableColumn label="序号" width="72">
            <template #default="{ $index }">
              {{ (filters.page - 1) * filters.size + $index + 1 }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请单" min-width="150" prop="applicationNo" />
          <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
          <ElTableColumn label="姓名" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.patientName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="住院号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.inpatientNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="性别" min-width="90">
            <template #default="{ row }">
              {{ formatNullable(row.patientGender) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="手术间" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.surgeryName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本名称" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.specimenName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.specimenRemovalAt ? 'success' : 'danger'">
                {{ formatRemovalStatus(row) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型" min-width="100">
            <template #default="{ row }">
              {{ formatNullable(row.specimenType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="离体时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.specimenRemovalAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="离体操作人" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.specimenRemovalOperatorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="添加时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.registeredAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="添加人" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.registeredByName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="120">
            <template #default="{ row }">
              <div class="flex min-h-8 items-center">
                <ElButton
                  v-if="canConfirmRemoval(row)"
                  :loading="actionLoading"
                  link
                  type="primary"
                  @click="submitConfirmRemoval(row)"
                >
                  离体确认
                </ElButton>
                <span v-else class="text-muted-foreground">-</span>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

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
