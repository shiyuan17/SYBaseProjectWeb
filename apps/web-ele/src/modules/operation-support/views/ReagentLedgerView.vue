<script setup lang="ts">
import type {
  ReagentStockView,
  ReagentView,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
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

const loading = reactive({
  reagents: false,
  stocks: false,
  warnings: false,
});
const submitting = ref(false);
const pageError = ref('');
const reagents = ref<ReagentView[]>([]);
const stocks = ref<ReagentStockView[]>([]);
const warnings = ref(awaitSafeWarnings());
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

function awaitSafeWarnings() {
  return [] as Awaited<ReturnType<typeof listReagentWarnings>>;
}

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

function resetReagentForm() {
  reagentForm.defaultLowStockThreshold = undefined;
  reagentForm.defaultNearExpiryDays = undefined;
  reagentForm.enabled = true;
  reagentForm.manufacturer = '';
  reagentForm.operatorName = '';
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
  stockForm.operatorName = '';
  stockForm.reagentId = '';
  stockForm.remarks = '';
  stockForm.stockQuantity = undefined;
  stockForm.stockStatus = 'ACTIVE';
  stockForm.storageLocation = '';
}

function openCreateReagentDialog() {
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
  editingReagent.value = row;
  reagentForm.defaultLowStockThreshold =
    row.defaultLowStockThreshold === null || row.defaultLowStockThreshold === undefined
      ? undefined
      : Number(row.defaultLowStockThreshold);
  reagentForm.defaultNearExpiryDays = row.defaultNearExpiryDays ?? undefined;
  reagentForm.enabled = row.enabled;
  reagentForm.manufacturer = row.manufacturer ?? '';
  reagentForm.operatorName = '';
  reagentForm.reagentCode = row.reagentCode;
  reagentForm.reagentName = row.reagentName;
  reagentForm.remarks = row.remarks ?? '';
  reagentForm.specification = row.specification ?? '';
  reagentForm.unit = row.unit ?? '';
}

function openCreateStockDialog() {
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
  editingStock.value = row;
  stockForm.batchNo = row.batchNo;
  stockForm.expiryDate = row.expiryDate ?? '';
  stockForm.lowStockThreshold =
    row.lowStockThreshold === null || row.lowStockThreshold === undefined
      ? undefined
      : Number(row.lowStockThreshold);
  stockForm.nearExpiryDays = row.nearExpiryDays ?? undefined;
  stockForm.operatorName = '';
  stockForm.reagentId = row.reagentId;
  stockForm.remarks = row.remarks ?? '';
  stockForm.stockQuantity =
    row.stockQuantity === null || row.stockQuantity === undefined
      ? undefined
      : Number(row.stockQuantity);
  stockForm.stockStatus = row.stockStatus;
  stockForm.storageLocation = row.storageLocation ?? '';
}

async function loadReagents() {
  loading.reagents = true;
  pageError.value = '';
  try {
    reagents.value = await listReagents({
      enabled: reagentFilters.enabled === '' ? undefined : reagentFilters.enabled,
      keyword: reagentFilters.keyword.trim() || undefined,
    });
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.reagents = false;
  }
}

async function loadStocks() {
  loading.stocks = true;
  try {
    stocks.value = await listReagentStocks({
      keyword: stockFilters.keyword.trim() || undefined,
      stockStatus: stockFilters.stockStatus || undefined,
    });
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.stocks = false;
  }
}

async function loadWarnings() {
  loading.warnings = true;
  try {
    warnings.value = await listReagentWarnings();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.warnings = false;
  }
}

async function submitReagent() {
  if (!reagentForm.reagentName || !reagentForm.operatorName) {
    ElMessage.warning('请填写试剂名称和操作人');
    return;
  }
  if (!editingReagent.value?.id && !reagentForm.reagentCode) {
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
    if (editingReagent.value?.id) {
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
  if (!stockForm.stockStatus || !stockForm.operatorName) {
    ElMessage.warning('请填写库存状态和操作人');
    return;
  }
  if (!editingStock.value?.id && (!stockForm.reagentId || !stockForm.batchNo)) {
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
    if (editingStock.value?.id) {
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

void Promise.all([loadReagents(), loadStocks(), loadWarnings()]);
</script>

<template>
  <Page title="试剂台账" description="维护试剂主数据、库存批次，并跟踪低库存和近效期预警。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <OperationSectionCard title="试剂主数据" description="按关键字和启停状态维护试剂台账。">
        <template #extra>
          <ElButton type="primary" @click="openCreateReagentDialog">新增试剂</ElButton>
        </template>
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
        <ElTable v-loading="loading.reagents" :data="reagents" border>
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
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="primary" @click="openEditReagentDialog(row)">
                编辑
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>

      <OperationSectionCard title="库存批次" description="维护试剂批号、数量、有效期和库位。">
        <template #extra>
          <ElButton type="primary" @click="openCreateStockDialog">新增库存</ElButton>
        </template>
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
        <ElTable v-loading="loading.stocks" :data="stocks" border>
          <ElTableColumn label="试剂" min-width="200">
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
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="primary" @click="openEditStockDialog(row)">
                编辑
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>

      <OperationSectionCard title="库存预警" description="展示低库存和近效期试剂批次。">
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
