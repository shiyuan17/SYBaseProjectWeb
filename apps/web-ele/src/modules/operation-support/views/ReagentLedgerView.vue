<script setup lang="ts">
import type {
  ReagentStockEventView,
  ReagentStockView,
  ReagentView,
} from '../types/operation-support';
import type {
  ReagentFormState,
  ReagentStockFormState,
} from '../utils/reagent-ledger';

import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { Download, Plus, Search, Square } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import { getReagentLedgerCapabilities } from '../access';
import {
  consumeReagentStock,
  createReagent,
  createReagentStock,
  exportReagentStocks,
  finishUsingReagentStock,
  importReagentStocks,
  listReagents,
  listReagentStockEvents,
  listReagentStocks,
  startUsingReagentStock,
  testReagentStock,
  updateReagent,
  updateReagentStock,
} from '../api/operation-support-service';
import ReagentDialog from '../components/ReagentDialog.vue';
import ReagentStockActionDialog from '../components/ReagentStockActionDialog.vue';
import ReagentStockDialog from '../components/ReagentStockDialog.vue';
import ReagentStockEventsDialog from '../components/ReagentStockEventsDialog.vue';
import {
  REAGENT_STOCK_STATUS_OPTIONS,
  REAGENT_TEMPLATE_STATUS_OPTIONS,
  REAGENT_TYPE_OPTIONS,
} from '../constants';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatReagentStockStatus,
  formatReagentTemplateStatus,
  formatReagentType,
} from '../utils/format';
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
  getStockStatusTagType,
  validateReagentForm,
  validateReagentStockForm,
} from '../utils/reagent-ledger';

const accessStore = useAccessStore();
const route = useRoute();

const capabilities = computed(() =>
  getReagentLedgerCapabilities(accessStore.accessCodes),
);

const activeTab = ref<'STOCK' | 'TEMPLATE'>('STOCK');
const loading = reactive({
  events: false,
  reagents: false,
  stocks: false,
});
const submitting = ref(false);
const pageError = ref('');
const reagents = ref<ReagentView[]>([]);
const stocks = ref<ReagentStockView[]>([]);
const stockEvents = ref<ReagentStockEventView[]>([]);
const selectedStock = ref<null | ReagentStockView>(null);
const editingReagent = ref<null | ReagentView>(null);
const editingStock = ref<null | ReagentStockView>(null);
const actionDialog = reactive({
  mode: '' as '' | 'CONSUME' | 'TEST',
  title: '',
  visible: false,
});
const eventsDialogVisible = ref(false);
const importInputRef = ref<HTMLInputElement>();

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

const reagentFilters = reactive({
  keyword: '',
  reagentType: '',
  templateStatus: 'ENABLED',
});

const stockFilters = reactive({
  dateFrom: '',
  dateTo: '',
  keyword: '',
  reagentType: '',
  stockStatus: '',
});

// oxlint-disable-next-line prefer-const -- Component v-model may assign a fresh form object.
let reagentForm = reactive<ReagentFormState>(createReagentFormDefaults());
// oxlint-disable-next-line prefer-const -- Component v-model may assign a fresh form object.
let stockForm = reactive<ReagentStockFormState>(
  createReagentStockFormDefaults(),
);

const pageTitle = computed(() => String(route.meta.title || '试剂耗材管理'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '维护试剂库存与试剂模板，跟踪测试、消耗和使用状态。',
  ),
);

function resetReagentForm() {
  Object.assign(reagentForm, createReagentFormDefaults());
}

function resetStockForm() {
  Object.assign(stockForm, createReagentStockFormDefaults());
}

function syncSelectedStock() {
  if (!selectedStock.value) {
    return;
  }
  selectedStock.value =
    stocks.value.find((item) => item.id === selectedStock.value?.id) ?? null;
}

function setSelectedStock(row: null | ReagentStockView) {
  selectedStock.value = row;
}

function openCreateTemplateDialog() {
  if (!capabilities.value.canCreateReagent) {
    ElMessage.warning('当前账号没有试剂模板维护权限');
    return;
  }
  editingReagent.value = createDraftReagentView();
  resetReagentForm();
}

function openEditTemplateDialog(row: ReagentView) {
  if (!capabilities.value.canUpdateReagent) {
    ElMessage.warning('当前账号没有试剂模板维护权限');
    return;
  }
  editingReagent.value = row;
  Object.assign(reagentForm, createReagentFormStateFromRow(row));
}

function openCreateStockDialog() {
  if (!capabilities.value.canManageStocks) {
    ElMessage.warning('当前账号没有试剂库存维护权限');
    return;
  }
  editingStock.value = createDraftReagentStockView();
  resetStockForm();
}

function openEditStockDialog() {
  if (!selectedStock.value) {
    return;
  }
  editingStock.value = selectedStock.value;
  Object.assign(
    stockForm,
    createReagentStockFormStateFromRow(selectedStock.value),
  );
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
      keyword: reagentFilters.keyword.trim() || undefined,
      reagentType: reagentFilters.reagentType || undefined,
      templateStatus: reagentFilters.templateStatus || undefined,
    });
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
      dateFrom: stockFilters.dateFrom || undefined,
      dateTo: stockFilters.dateTo || undefined,
      keyword: stockFilters.keyword.trim() || undefined,
      reagentType: stockFilters.reagentType || undefined,
      stockStatus: stockFilters.stockStatus || undefined,
    });
    syncSelectedStock();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.stocks = false;
  }
}

async function refreshPage() {
  await Promise.all([loadReagents(), loadStocks()]);
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
      ElMessage.success('试剂模板已更新');
    } else {
      await createReagent(buildCreateReagentRequest(reagentForm));
      ElMessage.success('试剂模板已创建');
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
      ElMessage.success('库存已更新');
    } else {
      await createReagentStock(buildCreateReagentStockRequest(stockForm));
      ElMessage.success('试剂已入库');
    }
    stockDialogVisible.value = false;
    await loadStocks();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

function openStockActionDialog(mode: 'CONSUME' | 'TEST') {
  if (!selectedStock.value) {
    ElMessage.warning('请先选择库存记录');
    return;
  }
  actionDialog.mode = mode;
  actionDialog.title = mode === 'TEST' ? '试剂测试' : '试剂消耗';
  actionDialog.visible = true;
}

async function submitStockAction(payload: {
  quantity?: number;
  remarks?: string;
}) {
  if (!selectedStock.value || !actionDialog.mode) {
    return;
  }
  submitting.value = true;
  try {
    if (actionDialog.mode === 'TEST') {
      await testReagentStock(selectedStock.value.id, payload);
      ElMessage.success('测试已记录');
    } else {
      await consumeReagentStock(selectedStock.value.id, payload);
      ElMessage.success('消耗已记录');
    }
    actionDialog.visible = false;
    await loadStocks();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function runStockStatusAction(
  action: 'FINISH_USE' | 'START_USE',
  successMessage: string,
) {
  if (!selectedStock.value) {
    ElMessage.warning('请先选择库存记录');
    return;
  }
  submitting.value = true;
  try {
    await (
      action === 'START_USE' ? startUsingReagentStock : finishUsingReagentStock
    )(selectedStock.value.id, {
      remarks: undefined,
    });
    ElMessage.success(successMessage);
    await loadStocks();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function openStockEventsDialog() {
  if (!selectedStock.value) {
    ElMessage.warning('请先选择库存记录');
    return;
  }
  eventsDialogVisible.value = true;
  loading.events = true;
  try {
    stockEvents.value = await listReagentStockEvents(selectedStock.value.id);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.events = false;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleExportStocks() {
  try {
    const blob = await exportReagentStocks({
      dateFrom: stockFilters.dateFrom || undefined,
      dateTo: stockFilters.dateTo || undefined,
      keyword: stockFilters.keyword.trim() || undefined,
      reagentType: stockFilters.reagentType || undefined,
      stockStatus: stockFilters.stockStatus || undefined,
    });
    if (blob instanceof Blob) {
      downloadBlob(blob, 'reagent-stocks.csv');
    }
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  }
}

function openImportPicker() {
  importInputRef.value?.click();
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  try {
    const result = await importReagentStocks(file);
    if (result.failureCount > 0) {
      ElMessage.warning(
        `导入完成：成功 ${result.successCount} 行，失败 ${result.failureCount} 行`,
      );
    } else {
      ElMessage.success(`导入完成：成功 ${result.successCount} 行`);
    }
    await loadStocks();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    input.value = '';
  }
}

void refreshPage();
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
    :show-header="false"
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

      <ElTabs v-model="activeTab" class="operation-support-tabs">
        <ElTabPane label="试剂库存" name="STOCK">
          <section class="rounded-lg border border-border bg-card">
            <div class="border-b border-border px-4 py-3">
              <ElForm class="flex flex-wrap items-end gap-x-3 gap-y-2" inline>
                <ElFormItem label="关键字">
                  <ElInput
                    v-model="stockFilters.keyword"
                    clearable
                    placeholder="试剂名称/医嘱名称"
                    style="width: 220px"
                    @keyup.enter="loadStocks"
                  />
                </ElFormItem>
                <ElFormItem label="入库日期">
                  <ElDatePicker
                    v-model="stockFilters.dateFrom"
                    placeholder="开始日期"
                    style="width: 148px"
                    type="date"
                    value-format="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem>
                  <ElDatePicker
                    v-model="stockFilters.dateTo"
                    placeholder="结束日期"
                    style="width: 148px"
                    type="date"
                    value-format="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem label="库存状态">
                  <ElSelect
                    v-model="stockFilters.stockStatus"
                    clearable
                    placeholder="全部"
                    style="width: 150px"
                  >
                    <ElOption
                      v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="试剂类型">
                  <ElSelect
                    v-model="stockFilters.reagentType"
                    clearable
                    placeholder="全部"
                    style="width: 190px"
                  >
                    <ElOption
                      v-for="option in REAGENT_TYPE_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem>
                  <ElButton
                    :disabled="!capabilities.canQueryStocks"
                    :icon="Search"
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
                :loading="loading.reagents || loading.stocks"
                @click="refreshPage"
              >
                刷新
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                type="primary"
                @click="openCreateStockDialog"
              >
                试剂入库
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                :disabled="!selectedStock"
                @click="openStockActionDialog('TEST')"
              >
                测试
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                :disabled="!selectedStock"
                @click="openStockActionDialog('CONSUME')"
              >
                消耗
              </ElButton>
              <ElButton
                v-if="capabilities.canQueryStocks"
                :disabled="!selectedStock"
                @click="openStockEventsDialog"
              >
                消耗明细
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                :disabled="!selectedStock"
                @click="runStockStatusAction('START_USE', '已开始使用')"
              >
                开始使用
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                :disabled="!selectedStock"
                :icon="Square"
                @click="runStockStatusAction('FINISH_USE', '已结束使用')"
              >
                结束使用
              </ElButton>
              <ElButton
                v-if="capabilities.canQueryStocks"
                :icon="Download"
                @click="handleExportStocks"
              >
                导出Excel
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                @click="openImportPicker"
              >
                导入Excel
              </ElButton>
              <ElButton
                v-if="capabilities.canManageStocks"
                :disabled="!selectedStock"
                @click="openEditStockDialog"
              >
                编辑库存
              </ElButton>
              <input
                ref="importInputRef"
                accept=".csv,text/csv"
                class="hidden"
                type="file"
                @change="handleImportFile"
              />
            </div>

            <div class="px-4 py-4">
              <ElAlert
                v-if="!capabilities.canQueryStocks"
                :closable="false"
                title="当前账号没有库存查询权限。"
                type="warning"
              />
              <ElTable
                v-else
                v-loading="loading.stocks"
                :data="stocks"
                border
                highlight-current-row
                @current-change="setSelectedStock"
              >
                <ElTableColumn type="selection" width="42" />
                <ElTableColumn label="试剂规格(初始数量)" min-width="150">
                  <template #default="{ row }">
                    {{ formatNullable(row.initialQuantity) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="试剂类型" min-width="170">
                  <template #default="{ row }">
                    {{ formatReagentType(row.reagentType) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="试剂名称" min-width="180">
                  <template #default="{ row }">
                    {{ formatNullable(row.reagentName) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="状态" min-width="110">
                  <template #default="{ row }">
                    <ElTag :type="getStockStatusTagType(row.stockStatus)">
                      {{ formatReagentStockStatus(row.stockStatus) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="试剂编号"
                  min-width="130"
                  prop="reagentCode"
                />
                <ElTableColumn label="对应医嘱" min-width="150">
                  <template #default="{ row }">
                    {{ formatNullable(row.orderItemName) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="手工消耗剩余数量" min-width="150">
                  <template #default="{ row }">
                    {{ formatNullable(row.remainingQuantity) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="综合剩余数量" min-width="130">
                  <template #default="{ row }">
                    {{
                      formatNullable(row.stockQuantity ?? row.remainingQuantity)
                    }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="订购提醒阈值" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.lowStockThreshold) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="测试提醒阈值" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.testReminderThreshold) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="生产日期" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.productionDate) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="有效期至" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.expiryDate) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="稀释比例" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.recommendedDilution) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="应用稀释" min-width="120">
                  <template #default="{ row }">
                    {{ formatNullable(row.applicationDilution) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="批次" min-width="130" prop="batchNo" />
                <ElTableColumn label="库位" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.storageLocation) }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </section>
        </ElTabPane>

        <ElTabPane label="试剂模板" name="TEMPLATE">
          <section class="rounded-lg border border-border bg-card">
            <div class="border-b border-border px-4 py-3">
              <ElForm class="flex flex-wrap items-end gap-x-3 gap-y-2" inline>
                <ElFormItem label="关键字">
                  <ElInput
                    v-model="reagentFilters.keyword"
                    clearable
                    placeholder="试剂名称/医嘱名称"
                    style="width: 240px"
                    @keyup.enter="loadReagents"
                  />
                </ElFormItem>
                <ElFormItem label="试剂类型">
                  <ElSelect
                    v-model="reagentFilters.reagentType"
                    clearable
                    placeholder="全部试剂类型"
                    style="width: 200px"
                  >
                    <ElOption
                      v-for="option in REAGENT_TYPE_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="状态">
                  <ElSelect
                    v-model="reagentFilters.templateStatus"
                    clearable
                    placeholder="全部"
                    style="width: 140px"
                  >
                    <ElOption
                      v-for="option in REAGENT_TEMPLATE_STATUS_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem>
                  <ElButton
                    :disabled="!capabilities.canQueryReagents"
                    :icon="Search"
                    :loading="loading.reagents"
                    type="primary"
                    @click="loadReagents"
                  >
                    查询
                  </ElButton>
                </ElFormItem>
              </ElForm>
            </div>

            <div class="flex flex-wrap gap-2 border-b border-border px-4 py-3">
              <ElButton
                v-if="capabilities.canCreateReagent"
                :icon="Plus"
                type="primary"
                @click="openCreateTemplateDialog"
              >
                新增试剂模板
              </ElButton>
            </div>

            <div class="px-4 py-4">
              <ElTable
                v-loading="loading.reagents"
                :data="reagents"
                border
                highlight-current-row
              >
                <ElTableColumn type="selection" width="42" />
                <ElTableColumn
                  label="试剂名称"
                  min-width="180"
                  prop="reagentName"
                />
                <ElTableColumn label="医嘱名" min-width="150">
                  <template #default="{ row }">
                    {{ formatNullable(row.orderItemName) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="试剂类别" min-width="170">
                  <template #default="{ row }">
                    {{ formatReagentType(row.reagentType) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="试剂用途" min-width="120">
                  <template #default="{ row }">
                    {{ formatNullable(row.reagentUsage) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="状态" min-width="100">
                  <template #default="{ row }">
                    <ElTag
                      :type="
                        row.templateStatus === 'ENABLED' ? 'success' : 'info'
                      "
                    >
                      {{ formatReagentTemplateStatus(row.templateStatus) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="初始有效期" min-width="110">
                  <template #default="{ row }">
                    {{ formatNullable(row.validityDays) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="临近过期阈值" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.defaultNearExpiryDays) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="稀释比例" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.recommendedDilution) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="库存阈值(订购提醒)" min-width="160">
                  <template #default="{ row }">
                    {{ formatNullable(row.defaultStockThreshold) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="预计每瓶可染色例数" min-width="170">
                  <template #default="{ row }">
                    {{ formatNullable(row.stainCapacity) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="染色例数阈值" min-width="130">
                  <template #default="{ row }">
                    {{ formatNullable(row.stainThreshold) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  v-if="capabilities.canUpdateReagent"
                  fixed="right"
                  label="操作"
                  width="100"
                >
                  <template #default="{ row }">
                    <ElButton
                      link
                      type="primary"
                      @click="openEditTemplateDialog(row)"
                    >
                      编辑
                    </ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </section>
        </ElTabPane>
      </ElTabs>
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

    <ReagentStockActionDialog
      v-model="actionDialog.visible"
      :require-quantity="true"
      :submitting="submitting"
      :title="actionDialog.title"
      @submit="submitStockAction"
    />

    <ReagentStockEventsDialog
      v-model="eventsDialogVisible"
      :events="stockEvents"
      :loading="loading.events"
    />
  </Page>
</template>
