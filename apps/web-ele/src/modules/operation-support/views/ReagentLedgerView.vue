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
import { useRoute } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
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
import { REAGENT_STOCK_STATUS_OPTIONS } from '../constants';
import ReagentCatalogPanel from '../components/ReagentCatalogPanel.vue';
import ReagentDialog from '../components/ReagentDialog.vue';
import ReagentStockDetailPanel from '../components/ReagentStockDetailPanel.vue';
import ReagentStockDialog from '../components/ReagentStockDialog.vue';
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
import { formatNullable, formatReagentStockStatus } from '../utils/format';

const accessStore = useAccessStore();
const userStore = useUserStore();
const route = useRoute();

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

const reagentCatalogDrawerVisible = ref(false);
const stockDetailDrawerVisible = ref(false);
const warningDrawerVisible = ref(false);

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

const pageTitle = computed(() => String(route.meta.title || '试剂台账'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '维护试剂基础信息、库存批次，并跟踪低库存与近效期预警。',
  ),
);

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

function openEditSelectedReagentDialog() {
  if (!selectedStock.value) {
    return;
  }

  const targetReagent =
    reagents.value.find((item) => item.id === selectedStock.value?.reagentId) ??
    selectedReagent.value;

  if (!targetReagent) {
    ElMessage.warning('未找到当前批次对应的试剂基础信息');
    return;
  }

  openEditReagentDialog(targetReagent);
}

function openEditSelectedStockDialog() {
  if (!selectedStock.value) {
    return;
  }

  openEditStockDialog(selectedStock.value);
}

function openReagentCatalogDrawer() {
  reagentCatalogDrawerVisible.value = true;
}

function openStockDetailDrawer() {
  if (!selectedStock.value) {
    return;
  }

  stockDetailDrawerVisible.value = true;
}

function openWarningDrawer() {
  warningDrawerVisible.value = true;
}

function scrollToStockTable() {
  document.querySelector('#reagent-stock-table')?.scrollIntoView({
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

  warningDrawerVisible.value = false;
  setSelectedStock(matchedStock);
  scrollToStockTable();
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

async function refreshReagentPage() {
  await Promise.all([loadReagents(), loadStocks(), loadWarnings()]);
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
    :title="pageTitle"
    :description="pageDescription"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <section class="rounded-lg border border-border bg-card shadow-sm">
        <div class="border-b border-border px-4 py-3">
          <ElForm class="flex flex-wrap items-end gap-x-4 gap-y-3" inline>
            <ElFormItem label="关键字" label-width="72px">
              <ElInput
                v-model="stockFilters.keyword"
                clearable
                placeholder="试剂/批号"
                style="width: 220px"
                @keyup.enter="loadStocks"
              />
            </ElFormItem>
            <ElFormItem label="库存状态" label-width="72px">
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
              <ElButton
                :disabled="!capabilities.canQueryStocks"
                :loading="loading.stocks"
                type="primary"
                @click="loadStocks"
              >
                查询
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          <ElButton
            :disabled="!capabilities.canQueryStocks"
            :loading="loading.reagents || loading.stocks || loading.warnings"
            @click="refreshReagentPage"
          >
            刷新
          </ElButton>
          <ElButton
            v-if="capabilities.canQueryReagents"
            @click="openReagentCatalogDrawer"
          >
            试剂目录
          </ElButton>
          <ElButton
            v-if="capabilities.canCreateReagent"
            type="primary"
            @click="openCreateReagentDialog"
          >
            新增试剂
          </ElButton>
          <ElButton
            v-if="capabilities.canUpdateReagent"
            :disabled="!selectedStock"
            @click="openEditSelectedReagentDialog"
          >
            编辑试剂
          </ElButton>
          <ElButton
            v-if="capabilities.canManageStocks"
            type="primary"
            plain
            @click="openCreateStockDialog"
          >
            新增库存
          </ElButton>
          <ElButton
            v-if="capabilities.canManageStocks"
            :disabled="!selectedStock"
            @click="openEditSelectedStockDialog"
          >
            编辑库存
          </ElButton>
          <ElButton
            v-if="capabilities.canQueryStocks"
            :disabled="!selectedStock"
            @click="openStockDetailDrawer"
          >
            批次详情
          </ElButton>
          <ElButton
            v-if="capabilities.canQueryWarnings"
            @click="openWarningDrawer"
          >
            库存预警
          </ElButton>
        </div>

        <div class="px-4 py-4">
          <ElAlert
            v-if="!capabilities.canQueryStocks"
            :closable="false"
            title="当前账号没有库存批次查询权限，仅可使用已开放的库存维护能力。"
            type="warning"
          />
          <ElTable
            v-else
            id="reagent-stock-table"
            v-loading="loading.stocks"
            :data="stocks"
            border
            highlight-current-row
            @current-change="setSelectedStock"
          >
            <ElTableColumn label="试剂编码" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.reagentCode) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="试剂名称" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.reagentName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="批号" min-width="140" prop="batchNo" />
            <ElTableColumn label="库存数量" min-width="110">
              <template #default="{ row }">
                {{ formatNullable(row.stockQuantity) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="库存状态" min-width="110">
              <template #default="{ row }">
                <ElTag :type="getStockStatusTagType(row.stockStatus)">
                  {{ formatReagentStockStatus(row.stockStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="有效期" min-width="130">
              <template #default="{ row }">
                {{ formatNullable(row.expiryDate) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="低库存阈值" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.lowStockThreshold) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="近效期天数" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.nearExpiryDays) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="存放位置" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.storageLocation) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.remarks) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </section>
    </div>

    <ElDrawer
      v-model="reagentCatalogDrawerVisible"
      :size="920"
      title="试剂目录"
    >
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
        @update:reagent-filters="Object.assign(reagentFilters, $event)"
      />
    </ElDrawer>

    <ElDrawer
      v-model="stockDetailDrawerVisible"
      :size="760"
      title="批次详情"
    >
      <ReagentStockDetailPanel
        :selected-reagent="selectedReagent"
        :selected-stock="selectedStock"
      />
    </ElDrawer>

    <ElDrawer
      v-model="warningDrawerVisible"
      :size="860"
      title="库存预警"
    >
      <ReagentWarningPanel
        :can-query-stocks="capabilities.canQueryStocks"
        :can-query-warnings="capabilities.canQueryWarnings"
        :get-warning-tag-type="getReagentWarningTagType"
        :loading="loading.warnings"
        :warnings="warnings"
        @load-warnings="loadWarnings"
        @navigate-to-stock-detail="navigateToStockDetail"
      />
    </ElDrawer>

    <ReagentDialog
      v-model="reagentDialogVisible"
      :reagent-form="reagentForm"
      :is-editing-reagent="isEditingReagent"
      :submitting="submitting"
      @update:reagent-form="Object.assign(reagentForm, $event)"
      @submit="submitReagent"
    />

    <ReagentStockDialog
      v-model="stockDialogVisible"
      :stock-form="stockForm"
      :is-editing-stock="isEditingStock"
      :reagents="reagents"
      :submitting="submitting"
      @update:stock-form="Object.assign(stockForm, $event)"
      @submit="submitStock"
    />
  </Page>
</template>
