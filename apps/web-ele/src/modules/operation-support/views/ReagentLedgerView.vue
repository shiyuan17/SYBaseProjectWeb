<script setup lang="ts">
import type {
  ReagentStockView,
  ReagentView,
  ReagentWarningView,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getReagentLedgerCapabilities } from '../access';
import {
  createReagent,
  createReagentStock,
  listReagents,
  listReagentStocks,
  listReagentWarnings,
  updateReagent,
  updateReagentStock,
} from '../api/operation-support-service';
import OperationSectionCard from '../components/OperationSectionCard.vue';
import {
  REAGENT_ENABLED_OPTIONS,
  REAGENT_STOCK_STATUS_OPTIONS,
} from '../constants';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatReagentStockStatus,
  formatWarningType,
} from '../utils/format';

const accessStore = useAccessStore();
const userStore = useUserStore();

const capabilities = computed(() =>
  getReagentLedgerCapabilities(accessStore.accessCodes),
);
const currentOperatorName = computed(
  () => userStore.userInfo?.realName?.trim() ?? '',
);

const loading = reactive({
  reagents: false,
  stocks: false,
  warnings: false,
});
const submitting = ref(false);
const pageError = ref('');
const reagents = ref<ReagentView[]>([]);
const stocks = ref<ReagentStockView[]>([]);
const warnings = ref<ReagentWarningView[]>([]);
const selectedReagent = ref<null | ReagentView>(null);
const selectedStock = ref<null | ReagentStockView>(null);
const editingReagent = ref<ReagentView | null>(null);
const editingStock = ref<ReagentStockView | null>(null);
const reagentDialogVisible = computed({
  get: () => editingReagent.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      editingReagent.value = null;
    }
  },
});
const stockDialogVisible = computed({
  get: () => editingStock.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      editingStock.value = null;
    }
  },
});

const reagentFilters = reactive<{
  enabled: boolean | '';
  keyword: string;
}>({
  enabled: '',
  keyword: '',
});

const stockFilters = reactive({
  keyword: '',
  stockStatus: '',
});

const reagentForm = reactive({
  defaultLowStockThreshold: undefined as number | undefined,
  defaultNearExpiryDays: undefined as number | undefined,
  enabled: true,
  manufacturer: '',
  operatorName: '',
  reagentCode: '',
  reagentName: '',
  remarks: '',
  specification: '',
  unit: '',
});

const stockForm = reactive({
  batchNo: '',
  expiryDate: '',
  lowStockThreshold: undefined as number | undefined,
  nearExpiryDays: undefined as number | undefined,
  operatorName: '',
  reagentId: '',
  remarks: '',
  stockQuantity: undefined as number | undefined,
  stockStatus: 'ACTIVE',
  storageLocation: '',
});

function getStockStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'DEPLETED' || status === 'EXPIRED') {
    return 'danger';
  }
  return 'info';
}

function getWarningTagType(type?: null | string) {
  if (type === 'LOW_STOCK') {
    return 'warning';
  }
  if (type === 'NEAR_EXPIRY') {
    return 'danger';
  }
  return 'info';
}

function getDefaultOperatorName() {
  return currentOperatorName.value;
}

function resetReagentForm() {
  reagentForm.defaultLowStockThreshold = undefined;
  reagentForm.defaultNearExpiryDays = undefined;
  reagentForm.enabled = true;
  reagentForm.manufacturer = '';
  reagentForm.operatorName = getDefaultOperatorName();
  reagentForm.reagentCode = '';
  reagentForm.reagentName = '';
  reagentForm.remarks = '';
  reagentForm.specification = '';
  reagentForm.unit = '';
}

function resetStockForm() {
  stockForm.batchNo = '';
  stockForm.expiryDate = '';
  stockForm.lowStockThreshold = undefined;
  stockForm.nearExpiryDays = undefined;
  stockForm.operatorName = getDefaultOperatorName();
  stockForm.reagentId = '';
  stockForm.remarks = '';
  stockForm.stockQuantity = undefined;
  stockForm.stockStatus = 'ACTIVE';
  stockForm.storageLocation = '';
}

function openCreateReagentDialog() {
  if (!capabilities.value.canCreateReagent) {
    ElMessage.warning('当前账号没有试剂基础信息维护权限');
    return;
  }

  editingReagent.value = {
    defaultLowStockThreshold: null,
    defaultNearExpiryDays: null,
    enabled: true,
    id: '',
    manufacturer: '',
    reagentCode: '',
    reagentName: '',
    remarks: '',
    specification: '',
    unit: '',
  };
  resetReagentForm();
}

function openEditReagentDialog(row: ReagentView) {
  if (!capabilities.value.canUpdateReagent) {
    ElMessage.warning('当前账号没有试剂基础信息维护权限');
    return;
  }

  editingReagent.value = row;
  reagentForm.defaultLowStockThreshold =
    row.defaultLowStockThreshold === null || row.defaultLowStockThreshold === undefined
      ? undefined
      : Number(row.defaultLowStockThreshold);
  reagentForm.defaultNearExpiryDays = row.defaultNearExpiryDays ?? undefined;
  reagentForm.enabled = row.enabled;
  reagentForm.manufacturer = row.manufacturer ?? '';
  reagentForm.operatorName = getDefaultOperatorName();
  reagentForm.reagentCode = row.reagentCode;
  reagentForm.reagentName = row.reagentName;
  reagentForm.remarks = row.remarks ?? '';
  reagentForm.specification = row.specification ?? '';
  reagentForm.unit = row.unit ?? '';
}

function openCreateStockDialog() {
  if (!capabilities.value.canManageStocks) {
    ElMessage.warning('当前账号没有试剂库存批次维护权限');
    return;
  }

  editingStock.value = {
    batchNo: '',
    expiryDate: null,
    id: '',
    lowStockThreshold: null,
    nearExpiryDays: null,
    reagentCode: null,
    reagentId: '',
    reagentName: null,
    remarks: null,
    stockQuantity: null,
    stockStatus: 'ACTIVE',
    storageLocation: null,
  };
  resetStockForm();
}

function openEditStockDialog(row: ReagentStockView) {
  if (!capabilities.value.canManageStocks) {
    ElMessage.warning('当前账号没有试剂库存批次维护权限');
    return;
  }

  editingStock.value = row;
  stockForm.batchNo = row.batchNo;
  stockForm.expiryDate = row.expiryDate ?? '';
  stockForm.lowStockThreshold =
    row.lowStockThreshold === null || row.lowStockThreshold === undefined
      ? undefined
      : Number(row.lowStockThreshold);
  stockForm.nearExpiryDays = row.nearExpiryDays ?? undefined;
  stockForm.operatorName = getDefaultOperatorName();
  stockForm.reagentId = row.reagentId;
  stockForm.remarks = row.remarks ?? '';
  stockForm.stockQuantity =
    row.stockQuantity === null || row.stockQuantity === undefined
      ? undefined
      : Number(row.stockQuantity);
  stockForm.stockStatus = row.stockStatus;
  stockForm.storageLocation = row.storageLocation ?? '';
}

function syncSelectedReagent() {
  if (!selectedReagent.value) {
    return;
  }

  selectedReagent.value =
    reagents.value.find((item) => item.id === selectedReagent.value?.id) ?? null;
}

function syncSelectedStock() {
  if (!selectedStock.value) {
    return;
  }

  const nextSelectedStock =
    stocks.value.find((item) => item.id === selectedStock.value?.id) ?? null;
  selectedStock.value = nextSelectedStock;
  if (nextSelectedStock) {
    selectedReagent.value =
      reagents.value.find((item) => item.id === nextSelectedStock.reagentId) ??
      selectedReagent.value;
  }
}

function setSelectedStock(row: null | ReagentStockView) {
  selectedStock.value = row;
  if (!row) {
    return;
  }

  selectedReagent.value =
    reagents.value.find((item) => item.id === row.reagentId) ?? selectedReagent.value;
}

function setSelectedReagent(row: null | ReagentView) {
  selectedReagent.value = row;
}

function scrollToStockDetail() {
  document.getElementById('reagent-stock-detail')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

async function loadReagents() {
  if (!capabilities.value.canQueryReagents) {
    reagents.value = [];
    return;
  }

  loading.reagents = true;
  pageError.value = '';
  try {
    reagents.value = await listReagents({
      enabled: reagentFilters.enabled === '' ? undefined : reagentFilters.enabled,
      keyword: reagentFilters.keyword.trim() || undefined,
    });
    syncSelectedReagent();
    syncSelectedStock();
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.reagents = false;
  }
}

async function loadStocks() {
  if (!capabilities.value.canQueryStocks) {
    stocks.value = [];
    selectedStock.value = null;
    return;
  }

  loading.stocks = true;
  try {
    stocks.value = await listReagentStocks({
      keyword: stockFilters.keyword.trim() || undefined,
      stockStatus: stockFilters.stockStatus || undefined,
    });
    syncSelectedStock();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.stocks = false;
  }
}

async function loadWarnings() {
  if (!capabilities.value.canQueryWarnings) {
    warnings.value = [];
    return;
  }

  loading.warnings = true;
  try {
    warnings.value = await listReagentWarnings();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.warnings = false;
  }
}

async function navigateToStockDetail(warning: ReagentWarningView) {
  if (!capabilities.value.canQueryStocks) {
    ElMessage.warning('当前账号没有库存批次查询权限，无法打开对应批次详情');
    return;
  }

  stockFilters.keyword = warning.batchNo;
  stockFilters.stockStatus = '';
  await loadStocks();

  const matchedStock = stocks.value.find((item) => item.id === warning.stockId);
  if (!matchedStock) {
    ElMessage.warning('未找到对应试剂批次，请刷新后重试');
    return;
  }

  setSelectedStock(matchedStock);
  scrollToStockDetail();
  ElMessage.success(`已定位到批次 ${warning.batchNo}`);
}

async function submitReagent() {
  if (!editingReagent.value) {
    return;
  }

  if (!reagentForm.reagentName || !reagentForm.operatorName) {
    ElMessage.warning('请填写试剂名称和操作人');
    return;
  }
  if (!editingReagent.value.id && !reagentForm.reagentCode) {
    ElMessage.warning('新增试剂需要填写试剂编码');
    return;
  }
  if (
    reagentForm.defaultLowStockThreshold !== undefined &&
    reagentForm.defaultLowStockThreshold < 0
  ) {
    ElMessage.warning('低库存阈值不能为负数');
    return;
  }

  submitting.value = true;
  try {
    if (editingReagent.value.id) {
      await updateReagent(editingReagent.value.id, {
        defaultLowStockThreshold: reagentForm.defaultLowStockThreshold,
        defaultNearExpiryDays: reagentForm.defaultNearExpiryDays,
        enabled: reagentForm.enabled,
        manufacturer: reagentForm.manufacturer || undefined,
        operatorName: reagentForm.operatorName,
        remarks: reagentForm.remarks || undefined,
        reagentName: reagentForm.reagentName,
        specification: reagentForm.specification || undefined,
        unit: reagentForm.unit || undefined,
      });
      ElMessage.success('试剂已更新');
    } else {
      await createReagent({
        defaultLowStockThreshold: reagentForm.defaultLowStockThreshold,
        defaultNearExpiryDays: reagentForm.defaultNearExpiryDays,
        enabled: reagentForm.enabled,
        manufacturer: reagentForm.manufacturer || undefined,
        operatorName: reagentForm.operatorName,
        remarks: reagentForm.remarks || undefined,
        reagentCode: reagentForm.reagentCode,
        reagentName: reagentForm.reagentName,
        specification: reagentForm.specification || undefined,
        unit: reagentForm.unit || undefined,
      });
      ElMessage.success('试剂已创建');
    }
    reagentDialogVisible.value = false;
    await loadReagents();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function submitStock() {
  if (!editingStock.value) {
    return;
  }

  if (!stockForm.stockStatus || !stockForm.operatorName) {
    ElMessage.warning('请填写库存状态和操作人');
    return;
  }
  if (!editingStock.value.id && (!stockForm.reagentId || !stockForm.batchNo)) {
    ElMessage.warning('新增库存需要选择试剂并填写批号');
    return;
  }
  if (stockForm.stockQuantity !== undefined && stockForm.stockQuantity < 0) {
    ElMessage.warning('库存数量不能为负数');
    return;
  }
  if (stockForm.lowStockThreshold !== undefined && stockForm.lowStockThreshold < 0) {
    ElMessage.warning('低库存阈值不能为负数');
    return;
  }

  submitting.value = true;
  try {
    if (editingStock.value.id) {
      await updateReagentStock(editingStock.value.id, {
        expiryDate: stockForm.expiryDate || undefined,
        lowStockThreshold: stockForm.lowStockThreshold,
        nearExpiryDays: stockForm.nearExpiryDays,
        operatorName: stockForm.operatorName,
        remarks: stockForm.remarks || undefined,
        stockQuantity: stockForm.stockQuantity,
        stockStatus: stockForm.stockStatus,
        storageLocation: stockForm.storageLocation || undefined,
      });
      ElMessage.success('库存批次已更新');
    } else {
      await createReagentStock({
        batchNo: stockForm.batchNo,
        expiryDate: stockForm.expiryDate || undefined,
        lowStockThreshold: stockForm.lowStockThreshold,
        nearExpiryDays: stockForm.nearExpiryDays,
        operatorName: stockForm.operatorName,
        reagentId: stockForm.reagentId,
        remarks: stockForm.remarks || undefined,
        stockQuantity: stockForm.stockQuantity,
        stockStatus: stockForm.stockStatus,
        storageLocation: stockForm.storageLocation || undefined,
      });
      ElMessage.success('库存批次已创建');
    }
    stockDialogVisible.value = false;
    await Promise.all([loadStocks(), loadWarnings()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function initializePage() {
  const tasks: Promise<void>[] = [];

  if (capabilities.value.canQueryReagents) {
    tasks.push(loadReagents());
  }
  if (capabilities.value.canQueryStocks) {
    tasks.push(loadStocks());
  }
  if (capabilities.value.canQueryWarnings) {
    tasks.push(loadWarnings());
  }

  await Promise.all(tasks);
}

void initializePage();
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
    title="试剂台账"
    description="维护试剂基础信息、库存批次，并跟踪低库存与近效期预警。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <OperationSectionCard
        v-if="
          capabilities.canQueryReagents ||
          capabilities.canCreateReagent ||
          capabilities.canUpdateReagent
        "
        title="试剂基础信息"
        description="按关键字和启停状态维护试剂基础台账。"
      >
        <template #extra>
          <ElButton
            v-if="capabilities.canCreateReagent"
            type="primary"
            @click="openCreateReagentDialog"
          >
            新增试剂
          </ElButton>
        </template>
        <ElAlert
          v-if="!capabilities.canQueryReagents"
          :closable="false"
          title="当前账号没有试剂基础信息查询权限，仅可使用已开放的维护或预警能力。"
          type="warning"
        />
        <template v-else>
          <ElForm inline label-width="88px">
            <ElFormItem label="关键字">
              <ElInput
                v-model="reagentFilters.keyword"
                clearable
                placeholder="编码/名称"
                style="width: 220px"
                @keyup.enter="loadReagents"
              />
            </ElFormItem>
            <ElFormItem label="启停状态">
              <ElSelect
                v-model="reagentFilters.enabled"
                clearable
                placeholder="全部"
                style="width: 160px"
              >
                <ElOption
                  v-for="option in REAGENT_ENABLED_OPTIONS"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <ElButton :loading="loading.reagents" type="primary" @click="loadReagents">
                查询
              </ElButton>
            </ElFormItem>
          </ElForm>
          <ElTable
            v-loading="loading.reagents"
            :data="reagents"
            border
            highlight-current-row
            @current-change="setSelectedReagent"
          >
            <ElTableColumn label="试剂编码" min-width="140" prop="reagentCode" />
            <ElTableColumn label="试剂名称" min-width="180" prop="reagentName" />
            <ElTableColumn label="规格" min-width="120">
              <template #default="{ row }">{{ formatNullable(row.specification) }}</template>
            </ElTableColumn>
            <ElTableColumn label="单位" min-width="90">
              <template #default="{ row }">{{ formatNullable(row.unit) }}</template>
            </ElTableColumn>
            <ElTableColumn label="厂家" min-width="160">
              <template #default="{ row }">{{ formatNullable(row.manufacturer) }}</template>
            </ElTableColumn>
            <ElTableColumn label="低库存阈值" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.defaultLowStockThreshold) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="100">
              <template #default="{ row }">
                <ElTag :type="row.enabled ? 'success' : 'info'">
                  {{ row.enabled ? '启用' : '停用' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              v-if="capabilities.canUpdateReagent"
              fixed="right"
              label="操作"
              width="100"
            >
              <template #default="{ row }">
                <ElButton link type="primary" @click="openEditReagentDialog(row)">
                  编辑
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        v-if="capabilities.canQueryStocks || capabilities.canManageStocks"
        title="试剂库存批次"
        description="维护试剂库存批次、数量、阈值、有效期和库位。"
      >
        <template #extra>
          <ElButton
            v-if="capabilities.canManageStocks"
            type="primary"
            @click="openCreateStockDialog"
          >
            新增库存
          </ElButton>
        </template>
        <ElAlert
          v-if="!capabilities.canQueryStocks"
          :closable="false"
          title="当前账号没有库存批次查询权限，仅可使用已开放的库存维护能力。"
          type="warning"
        />
        <template v-else>
          <ElForm inline label-width="88px">
            <ElFormItem label="关键字">
              <ElInput
                v-model="stockFilters.keyword"
                clearable
                placeholder="试剂/批号"
                style="width: 220px"
                @keyup.enter="loadStocks"
              />
            </ElFormItem>
            <ElFormItem label="库存状态">
              <ElSelect
                v-model="stockFilters.stockStatus"
                clearable
                placeholder="全部"
                style="width: 160px"
              >
                <ElOption
                  v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <ElButton :loading="loading.stocks" type="primary" @click="loadStocks">
                查询
              </ElButton>
            </ElFormItem>
          </ElForm>
          <ElTable
            v-loading="loading.stocks"
            :data="stocks"
            border
            highlight-current-row
            @current-change="setSelectedStock"
          >
            <ElTableColumn label="试剂" min-width="220">
              <template #default="{ row }">
                {{ formatNullable(row.reagentCode) }} {{ formatNullable(row.reagentName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="批号" min-width="140" prop="batchNo" />
            <ElTableColumn label="数量" min-width="100">
              <template #default="{ row }">{{ formatNullable(row.stockQuantity) }}</template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="110">
              <template #default="{ row }">
                <ElTag :type="getStockStatusTagType(row.stockStatus)">
                  {{ formatReagentStockStatus(row.stockStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="有效期" min-width="130">
              <template #default="{ row }">{{ formatNullable(row.expiryDate) }}</template>
            </ElTableColumn>
            <ElTableColumn label="存放位置" min-width="160">
              <template #default="{ row }">{{ formatNullable(row.storageLocation) }}</template>
            </ElTableColumn>
            <ElTableColumn
              v-if="capabilities.canManageStocks"
              fixed="right"
              label="操作"
              width="100"
            >
              <template #default="{ row }">
                <ElButton link type="primary" @click="openEditStockDialog(row)">
                  编辑
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        id="reagent-stock-detail"
        title="批次详情"
        description="用于承接库存表选择和预警跳转，查看对应批次与试剂主数据。"
      >
        <ElAlert
          v-if="!selectedStock"
          :closable="false"
          title="请在库存批次列表中选择一条批次，或在预警列表中点击“查看批次”。"
          type="info"
        />
        <template v-else>
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="试剂编码">
              {{ formatNullable(selectedStock.reagentCode) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="试剂名称">
              {{ formatNullable(selectedStock.reagentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="批号">
              {{ selectedStock.batchNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="库存状态">
              {{ formatReagentStockStatus(selectedStock.stockStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前数量">
              {{ formatNullable(selectedStock.stockQuantity) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="低库存阈值">
              {{ formatNullable(selectedStock.lowStockThreshold) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="近效期天数">
              {{ formatNullable(selectedStock.nearExpiryDays) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="有效期">
              {{ formatNullable(selectedStock.expiryDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="存放位置">
              {{ formatNullable(selectedStock.storageLocation) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="备注">
              {{ formatNullable(selectedStock.remarks) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="试剂默认阈值">
              {{ formatNullable(selectedReagent?.defaultLowStockThreshold) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="试剂默认近效期">
              {{ formatNullable(selectedReagent?.defaultNearExpiryDays) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        v-if="capabilities.canQueryWarnings"
        title="试剂预警"
        description="支持 LOW_STOCK 与 NEAR_EXPIRY 预警，并可跳转到对应批次详情。"
      >
        <template #extra>
          <ElButton :loading="loading.warnings" @click="loadWarnings">刷新</ElButton>
        </template>
        <ElTable v-loading="loading.warnings" :data="warnings" border>
          <ElTableColumn label="预警" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getWarningTagType(row.warningType)">
                {{ formatWarningType(row.warningType) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="试剂" min-width="220">
            <template #default="{ row }">
              {{ row.reagentCode }} {{ row.reagentName }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="批号" min-width="140" prop="batchNo" />
          <ElTableColumn label="当前数量" min-width="110">
            <template #default="{ row }">{{ formatNullable(row.stockQuantity) }}</template>
          </ElTableColumn>
          <ElTableColumn label="有效期" min-width="130">
            <template #default="{ row }">{{ formatNullable(row.expiryDate) }}</template>
          </ElTableColumn>
          <ElTableColumn
            v-if="capabilities.canQueryStocks"
            fixed="right"
            label="跳转"
            width="110"
          >
            <template #default="{ row }">
              <ElButton link type="primary" @click="navigateToStockDetail(row)">
                查看批次
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>
    </div>

    <ElDialog v-model="reagentDialogVisible" title="试剂维护" width="680px">
      <ElForm label-width="120px">
        <ElFormItem label="试剂编码" required>
          <ElInput v-model="reagentForm.reagentCode" :disabled="!!editingReagent?.id" />
        </ElFormItem>
        <ElFormItem label="试剂名称" required>
          <ElInput v-model="reagentForm.reagentName" />
        </ElFormItem>
        <ElFormItem label="规格">
          <ElInput v-model="reagentForm.specification" />
        </ElFormItem>
        <ElFormItem label="单位">
          <ElInput v-model="reagentForm.unit" />
        </ElFormItem>
        <ElFormItem label="厂家">
          <ElInput v-model="reagentForm.manufacturer" />
        </ElFormItem>
        <ElFormItem label="低库存阈值">
          <ElInputNumber v-model="reagentForm.defaultLowStockThreshold" :min="0" />
        </ElFormItem>
        <ElFormItem label="近效期天数">
          <ElInputNumber v-model="reagentForm.defaultNearExpiryDays" :min="0" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="reagentForm.enabled" />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="reagentForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="reagentForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="reagentDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitReagent">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="stockDialogVisible" title="库存批次维护" width="680px">
      <ElForm label-width="120px">
        <ElFormItem label="试剂" required>
          <ElSelect
            v-model="stockForm.reagentId"
            :disabled="!!editingStock?.id"
            filterable
          >
            <ElOption
              v-for="reagent in reagents"
              :key="reagent.id"
              :label="`${reagent.reagentCode} ${reagent.reagentName}`"
              :value="reagent.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="批号" required>
          <ElInput v-model="stockForm.batchNo" :disabled="!!editingStock?.id" />
        </ElFormItem>
        <ElFormItem label="数量">
          <ElInputNumber v-model="stockForm.stockQuantity" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态" required>
          <ElSelect v-model="stockForm.stockStatus">
            <ElOption
              v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="有效期">
          <ElInput v-model="stockForm.expiryDate" placeholder="YYYY-MM-DD" />
        </ElFormItem>
        <ElFormItem label="存放位置">
          <ElInput v-model="stockForm.storageLocation" />
        </ElFormItem>
        <ElFormItem label="低库存阈值">
          <ElInputNumber v-model="stockForm.lowStockThreshold" :min="0" />
        </ElFormItem>
        <ElFormItem label="近效期天数">
          <ElInputNumber v-model="stockForm.nearExpiryDays" :min="0" />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="stockForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="stockForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="stockDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitStock">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
