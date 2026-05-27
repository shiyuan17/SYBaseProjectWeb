<script setup lang="ts">
import type {
  ChargeItemView,
  CreateChargeItemRequest,
  MedicalOrderCategoryNode,
  UpdateChargeItemRequest,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createChargeItem,
  deleteChargeItem,
  exportChargeItems,
  importChargeItems,
  listChargeItemsPage,
  listMedicalOrderDicts,
  updateChargeItem,
  updateChargeItemEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import {
  M1_PERMISSION_CODES,
  YES_NO_OPTIONS,
} from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { buildChargeItemSubmitPayload } from '../utils/submit-payloads';
import { flattenTree } from '../utils/tree';

const loading = ref(false);
const submitLoading = ref(false);
const exportLoading = ref(false);
const importLoading = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const pageError = ref('');
const importInputRef = ref<HTMLInputElement>();

const items = ref<ChargeItemView[]>([]);
const total = ref(0);
const dictTree = ref<MedicalOrderCategoryNode[]>([]);

const filters = reactive({
  enabled: undefined as boolean | undefined,
  keyword: '',
  orderDictItemId: '',
  page: 1,
  size: 10,
});

const form = reactive<CreateChargeItemRequest & { id?: string }>({
  chargeItemCode: '',
  chargeItemName: '',
  enabled: true,
  id: undefined,
  orderDictItemId: '',
  price: 0,
  sortOrder: 0,
  specification: '',
  unit: '',
});

const orderItemOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];
  flattenTree(dictTree.value, (node) => {
    if ('items' in node && Array.isArray(node.items)) {
      node.items.forEach((item) => {
        options.push({
          label: `${item.orderItemName} (${item.orderItemCode})`,
          value: item.id,
        });
      });
    }
  });
  return options;
});

function resetForm() {
  Object.assign(form, {
    chargeItemCode: '',
    chargeItemName: '',
    enabled: true,
    id: undefined,
    orderDictItemId: '',
    price: 0,
    sortOrder: 0,
    specification: '',
    unit: '',
  });
}

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listChargeItemsPage({
      enabled: filters.enabled,
      keyword: filters.keyword || null,
      orderDictItemId: filters.orderDictItemId || null,
      page: filters.page,
      size: filters.size,
    });
    items.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadDictOptions() {
  try {
    dictTree.value = await listMedicalOrderDicts();
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  }
}

function handleSearch() {
  filters.page = 1;
  void loadData();
}

function handleReset() {
  filters.enabled = undefined;
  filters.keyword = '';
  filters.orderDictItemId = '';
  filters.page = 1;
  filters.size = 10;
  void loadData();
}

function openCreateDialog() {
  resetForm();
  dialogMode.value = 'create';
  dialogVisible.value = true;
}

function openEditDialog(item: ChargeItemView) {
  resetForm();
  dialogMode.value = 'edit';
  Object.assign(form, {
    chargeItemCode: item.chargeItemCode,
    chargeItemName: item.chargeItemName,
    enabled: item.enabled,
    id: item.id,
    orderDictItemId: item.orderDictItemId,
    price: item.price,
    sortOrder: item.sortOrder,
    specification: item.specification ?? '',
    unit: item.unit ?? '',
  });
  dialogVisible.value = true;
}

async function submitForm() {
  submitLoading.value = true;
  try {
    const payload = buildChargeItemSubmitPayload(form, dialogMode.value);
    if (dialogMode.value === 'create') {
      await createChargeItem(payload);
      ElMessage.success('收费项目已创建');
    } else if (form.id) {
      await updateChargeItem(form.id, payload as UpdateChargeItemRequest);
      ElMessage.success('收费项目已更新');
    }
    dialogVisible.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

async function toggleEnabled(row: ChargeItemView) {
  await updateChargeItemEnabled(row.id, !row.enabled);
  ElMessage.success('状态已更新');
  await loadData();
}

async function removeItem(row: ChargeItemView) {
  await deleteChargeItem(row.id);
  ElMessage.success('收费项目已删除');
  await loadData();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const blob = await exportChargeItems({
      enabled: filters.enabled,
      keyword: filters.keyword || undefined,
      orderDictItemId: filters.orderDictItemId || undefined,
    });
    if (blob instanceof Blob) {
      downloadBlob(blob, 'medical-order-charge-items.csv');
      ElMessage.success('导出成功');
    }
  } finally {
    exportLoading.value = false;
  }
}

function triggerImport() {
  importInputRef.value?.click();
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  importLoading.value = true;
  try {
    await importChargeItems(file);
    ElMessage.success('导入成功');
    await loadData();
  } finally {
    importLoading.value = false;
    target.value = '';
  }
}

async function loadInitialData() {
  await Promise.all([loadData(), loadDictOptions()]);
}

onMounted(loadInitialData);
</script>

<template>
  <Page
    title="医嘱收费"
    description="维护医嘱收费项目，收费编码由系统自动生成，支持筛选、导入导出和关联医嘱条目。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="flex flex-col gap-4">
      <SystemSectionCard title="筛选条件" description="按关键字、启停状态和医嘱条目筛选。">
        <ElForm inline label-width="72px">
          <ElFormItem label="关键字">
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="收费编码 / 收费名称"
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect v-model="filters.enabled" clearable placeholder="全部" style="width: 160px">
              <ElOption
                v-for="option in YES_NO_OPTIONS"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="医嘱条目">
            <ElSelect
              v-model="filters.orderDictItemId"
              clearable
              filterable
              placeholder="全部条目"
              style="width: 280px"
            >
              <ElOption
                v-for="option in orderItemOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </SystemSectionCard>

      <SystemSectionCard title="收费项目列表" description="展示系统自动生成的收费编码，维护名称、规格、单位和价格。">
        <template #extra>
          <input
            ref="importInputRef"
            accept=".xls,.xlsx"
            class="hidden"
            type="file"
            @change="handleImport"
          />
          <ElButton :loading="importLoading" @click="triggerImport">导入</ElButton>
          <ElButton :loading="exportLoading" @click="handleExport">导出</ElButton>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.ORDER_CHARGE_CREATE"
            type="primary"
            @click="openCreateDialog"
          >
            新增收费项目
          </ElButton>
        </template>

        <ElTable v-loading="loading" :data="items" border>
          <ElTableColumn label="收费编码" min-width="140" prop="chargeItemCode" />
          <ElTableColumn label="收费名称" min-width="180" prop="chargeItemName" />
          <ElTableColumn label="医嘱条目" min-width="180">
            <template #default="scope">
              {{ scope?.row?.orderItemName ?? '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="规格" min-width="120">
            <template #default="scope">
              {{ scope?.row?.specification ?? '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="单位" min-width="100">
            <template #default="scope">
              {{ scope?.row?.unit ?? '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="价格" min-width="100" prop="price" />
          <ElTableColumn label="状态" width="90">
            <template #default="scope">
              <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="scope">
              <div v-if="scope?.row" class="flex flex-wrap gap-2">
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.ORDER_CHARGE_CREATE"
                  link
                  type="primary"
                  @click="openEditDialog(scope.row)"
                >
                  编辑
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.ORDER_CHARGE_CREATE"
                  link
                  type="primary"
                  @click="toggleEnabled(scope.row)"
                >
                  {{ scope.row.enabled ? '停用' : '启用' }}
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.ORDER_CHARGE_CREATE"
                  link
                  type="danger"
                  @click="removeItem(scope.row)"
                >
                  删除
                </ElButton>
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
            @current-change="loadData"
            @size-change="loadData"
          />
        </div>
      </SystemSectionCard>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增收费项目' : '编辑收费项目'"
      width="700px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="关联医嘱" required>
          <ElSelect
            v-model="form.orderDictItemId"
            filterable
            placeholder="请选择医嘱条目"
            style="width: 100%"
          >
            <ElOption
              v-for="option in orderItemOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="收费名称" required>
          <ElInput v-model="form.chargeItemName" />
        </ElFormItem>
        <ElFormItem label="规格">
          <ElInput v-model="form.specification" />
        </ElFormItem>
        <ElFormItem label="单位">
          <ElInput v-model="form.unit" />
        </ElFormItem>
        <ElFormItem label="价格">
          <ElInputNumber v-model="form.price" :min="0" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sortOrder" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="submitLoading" type="primary" @click="submitForm">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
