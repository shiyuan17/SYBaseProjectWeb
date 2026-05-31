<script setup lang="ts">
import type {
  ReagentStockView,
  ReagentView,
  ReagentWarningView,
} from '../types/operation-support';
import type {
  ReagentFormState,
  ReagentStockFormState,
} from '../utils/reagent-ledger';

import { computed, reactive, ref } from 'vue';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import { ElAlert, ElMessage } from 'element-plus';

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
import ReagentCatalogPanel from '../components/ReagentCatalogPanel.vue';
import ReagentDialog from '../components/ReagentDialog.vue';
import ReagentStockDetailPanel from '../components/ReagentStockDetailPanel.vue';
import ReagentStockDialog from '../components/ReagentStockDialog.vue';
import ReagentStockPanel from '../components/ReagentStockPanel.vue';
import ReagentWarningPanel from '../components/ReagentWarningPanel.vue';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  buildCreateReagentRequest,
  buildCreateReagentStockRequest,
  buildUpdateReagentRequest,
  buildUpdateReagentStockRequest,
  createDraftReagentStockView,
  createDraftReagentView,
  createReagentFormDefaults,
  createReagentFormStateFromRow,
  createReagentStockFormDefaults,
  createReagentStockFormStateFromRow,
  getReagentWarningTagType,
  getStockStatusTagType,
  validateReagentForm,
  validateReagentStockForm,
} from '../utils/reagent-ledger';

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
const editingReagent = ref<null | ReagentView>(null);
const editingStock = ref<null | ReagentStockView>(null);
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
const isEditingReagent = computed(() => Boolean(editingReagent.value?.id));
const isEditingStock = computed(() => Boolean(editingStock.value?.id));

const reagentFilters = reactive<{
  enabled: '' | boolean;
  keyword: string;
}>({
  enabled: '',
  keyword: '',
});

const stockFilters = reactive({
  keyword: '',
  stockStatus: '',
});

const reagentForm = reactive<ReagentFormState>(
  createReagentFormDefaults(getDefaultOperatorName()),
);

const stockForm = reactive<ReagentStockFormState>(
  createReagentStockFormDefaults(getDefaultOperatorName()),
);

const getWarningTagType = getReagentWarningTagType;

function getDefaultOperatorName() {
  return currentOperatorName.value;
}

function resetReagentForm() {
  Object.assign(
    reagentForm,
    createReagentFormDefaults(getDefaultOperatorName()),
  );
}

function resetStockForm() {
  Object.assign(
    stockForm,
    createReagentStockFormDefaults(getDefaultOperatorName()),
  );
}

function openCreateReagentDialog() {
  if (!capabilities.value.canCreateReagent) {
    ElMessage.warning('当前账号没有试剂基础信息维护权限');
    return;
  }

  editingReagent.value = createDraftReagentView();
  resetReagentForm();
}

function openEditReagentDialog(row: ReagentView) {
  if (!capabilities.value.canUpdateReagent) {
    ElMessage.warning('当前账号没有试剂基础信息维护权限');
    return;
  }

  editingReagent.value = row;
  Object.assign(
    reagentForm,
    createReagentFormStateFromRow(row, getDefaultOperatorName()),
  );
}

function openCreateStockDialog() {
  if (!capabilities.value.canManageStocks) {
    ElMessage.warning('当前账号没有试剂库存批次维护权限');
    return;
  }

  editingStock.value = createDraftReagentStockView();
  resetStockForm();
}

function openEditStockDialog(row: ReagentStockView) {
  if (!capabilities.value.canManageStocks) {
    ElMessage.warning('当前账号没有试剂库存批次维护权限');
    return;
  }

  editingStock.value = row;
  Object.assign(
    stockForm,
    createReagentStockFormStateFromRow(row, getDefaultOperatorName()),
  );
}

function syncSelectedReagent() {
  if (!selectedReagent.value) {
    return;
  }

  selectedReagent.value =
    reagents.value.find((item) => item.id === selectedReagent.value?.id) ??
    null;
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
    reagents.value.find((item) => item.id === row.reagentId) ??
    selectedReagent.value;
}

function setSelectedReagent(row: null | ReagentView) {
  selectedReagent.value = row;
}

function scrollToStockDetail() {
  document.querySelector('#reagent-stock-detail')?.scrollIntoView({
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
      enabled:
        reagentFilters.enabled === '' ? undefined : reagentFilters.enabled,
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

  const validationMessage = validateReagentForm(
    reagentForm,
    !editingReagent.value.id,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  submitting.value = true;
  try {
    if (editingReagent.value.id) {
      await updateReagent(
        editingReagent.value.id,
        buildUpdateReagentRequest(reagentForm),
      );
      ElMessage.success('试剂已更新');
    } else {
      await createReagent(buildCreateReagentRequest(reagentForm));
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

  const validationMessage = validateReagentStockForm(
    stockForm,
    !editingStock.value.id,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  submitting.value = true;
  try {
    if (editingStock.value.id) {
      await updateReagentStock(
        editingStock.value.id,
        buildUpdateReagentStockRequest(stockForm),
      );
      ElMessage.success('库存批次已更新');
    } else {
      await createReagentStock(buildCreateReagentStockRequest(stockForm));
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

      <ReagentCatalogPanel
        :reagent-filters="reagentFilters"
        :can-create-reagent="capabilities.canCreateReagent"
        :can-query-reagents="capabilities.canQueryReagents"
        :can-update-reagent="capabilities.canUpdateReagent"
        :loading="loading.reagents"
        :reagents="reagents"
        @load-reagents="loadReagents"
        @open-create-reagent-dialog="openCreateReagentDialog"
        @open-edit-reagent-dialog="openEditReagentDialog"
        @set-selected-reagent="setSelectedReagent"
      />

      <ReagentStockPanel
        :stock-filters="stockFilters"
        :can-manage-stocks="capabilities.canManageStocks"
        :can-query-stocks="capabilities.canQueryStocks"
        :get-stock-status-tag-type="getStockStatusTagType"
        :loading="loading.stocks"
        :stocks="stocks"
        @load-stocks="loadStocks"
        @open-create-stock-dialog="openCreateStockDialog"
        @open-edit-stock-dialog="openEditStockDialog"
        @set-selected-stock="setSelectedStock"
      />

      <ReagentStockDetailPanel
        :selected-reagent="selectedReagent"
        :selected-stock="selectedStock"
      />

      <ReagentWarningPanel
        :can-query-stocks="capabilities.canQueryStocks"
        :can-query-warnings="capabilities.canQueryWarnings"
        :get-warning-tag-type="getWarningTagType"
        :loading="loading.warnings"
        :warnings="warnings"
        @load-warnings="loadWarnings"
        @navigate-to-stock-detail="navigateToStockDetail"
      />
    </div>

    <ReagentDialog
      v-model="reagentDialogVisible"
      v-model:reagent-form="reagentForm"
      :is-editing-reagent="isEditingReagent"
      :submitting="submitting"
      @submit="submitReagent"
    />

    <ReagentStockDialog
      v-model="stockDialogVisible"
      v-model:stock-form="stockForm"
      :is-editing-stock="isEditingStock"
      :reagents="reagents"
      :submitting="submitting"
      @submit="submitStock"
    />
  </Page>
</template>
