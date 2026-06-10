<script setup lang="ts">
import type {
  MedicalOrderCategoryNode,
  PackageView,
  UpdatePackageRequest,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createMedicalOrderPackage,
  deleteMedicalOrderPackage,
  listMedicalOrderDicts,
  listMedicalOrderPackagesPage,
  updateMedicalOrderPackage,
  updateMedicalOrderPackageEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES, YES_NO_OPTIONS } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { buildPackageSubmitPayload } from '../utils/submit-payloads';
import { flattenTree } from '../utils/tree';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const pageError = ref('');

const items = ref<PackageView[]>([]);
const total = ref(0);
const dictTree = ref<MedicalOrderCategoryNode[]>([]);

const filters = reactive({
  enabled: undefined as boolean | undefined,
  keyword: '',
  packageType: '',
  page: 1,
  size: 10,
});

const form = reactive({
  enabled: true,
  id: '',
  itemIds: [] as string[],
  ownerUserId: '',
  packageCode: '',
  packageName: '',
  packageType: '',
  remarks: '',
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

function formatPackageItemNames(row: PackageView) {
  return row.items.map((item) => item.orderItemName).join('、') || '-';
}

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listMedicalOrderPackagesPage({
      enabled: filters.enabled,
      keyword: filters.keyword || null,
      packageType: filters.packageType || null,
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

async function loadDictTree() {
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
  filters.packageType = '';
  filters.page = 1;
  filters.size = 10;
  void loadData();
}

function resetForm() {
  Object.assign(form, {
    enabled: true,
    id: '',
    itemIds: [],
    ownerUserId: '',
    packageCode: '',
    packageName: '',
    packageType: '',
    remarks: '',
  });
}

function openCreateDialog() {
  resetForm();
  dialogMode.value = 'create';
  dialogVisible.value = true;
}

function openEditDialog(row: PackageView) {
  resetForm();
  dialogMode.value = 'edit';
  Object.assign(form, {
    enabled: row.enabled,
    id: row.id,
    itemIds: row.items.map((item) => item.orderItemId),
    ownerUserId: row.ownerUserId ?? '',
    packageCode: row.packageCode,
    packageName: row.packageName,
    packageType: row.packageType ?? '',
    remarks: row.remarks ?? '',
  });
  dialogVisible.value = true;
}

async function submitForm() {
  submitLoading.value = true;
  try {
    const payload = buildPackageSubmitPayload(form, dialogMode.value);
    if (dialogMode.value === 'create') {
      await createMedicalOrderPackage(payload);
      ElMessage.success('医嘱套餐已创建');
    } else {
      await updateMedicalOrderPackage(form.id, payload as UpdatePackageRequest);
      ElMessage.success('医嘱套餐已更新');
    }
    dialogVisible.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

async function toggleEnabled(row: PackageView) {
  await updateMedicalOrderPackageEnabled(row.id, !row.enabled);
  ElMessage.success('套餐状态已更新');
  await loadData();
}

async function removeItem(row: PackageView) {
  await deleteMedicalOrderPackage(row.id);
  ElMessage.success('套餐已删除');
  await loadData();
}

async function loadInitialData() {
  await Promise.all([loadData(), loadDictTree()]);
}

onMounted(loadInitialData);
</script>

<template>
  <Page
    :show-header="false"
    title="医嘱套餐"
    description="维护医嘱套餐、套餐类型、负责人和套餐条目，套餐编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="flex flex-col gap-4">
      <SystemSectionCard
        title="筛选条件"
        description="按关键字、启停状态和套餐类型筛选。"
      >
        <ElForm inline label-width="72px">
          <ElFormItem label="关键字">
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="套餐编码 / 套餐名称"
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect
              v-model="filters.enabled"
              clearable
              placeholder="全部"
              style="width: 160px"
            >
              <ElOption
                v-for="option in YES_NO_OPTIONS"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="套餐类型">
            <ElInput
              v-model="filters.packageType"
              placeholder="请输入套餐类型"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </SystemSectionCard>

      <SystemSectionCard
        title="套餐列表"
        description="支持新增、编辑、启停和删除。"
      >
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.PACKAGE_CREATE"
            type="primary"
            @click="openCreateDialog"
          >
            新增套餐
          </ElButton>
        </template>

        <ElTable v-loading="loading" :data="items" border>
          <ElTableColumn label="套餐编码" min-width="140" prop="packageCode" />
          <ElTableColumn label="套餐名称" min-width="180" prop="packageName" />
          <ElTableColumn label="套餐类型" min-width="120" prop="packageType" />
          <ElTableColumn label="条目数" width="90">
            <template #default="scope">
              {{ scope?.row?.items.length ?? 0 }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="90">
            <template #default="scope">
              <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="套餐条目" min-width="220">
            <template #default="scope">
              {{ scope?.row ? formatPackageItemNames(scope.row) : '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="scope">
              <div v-if="scope?.row" class="flex flex-wrap gap-2">
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.PACKAGE_CREATE"
                  link
                  type="primary"
                  @click="openEditDialog(scope.row)"
                >
                  编辑
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.PACKAGE_CREATE"
                  link
                  type="primary"
                  @click="toggleEnabled(scope.row)"
                >
                  {{ scope.row.enabled ? '停用' : '启用' }}
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.PACKAGE_CREATE"
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
      :title="dialogMode === 'create' ? '新增套餐' : '编辑套餐'"
      width="760px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="套餐名称" required>
          <ElInput v-model="form.packageName" />
        </ElFormItem>
        <ElFormItem label="套餐类型">
          <ElInput v-model="form.packageType" />
        </ElFormItem>
        <ElFormItem label="负责人 ID">
          <ElInput v-model="form.ownerUserId" />
        </ElFormItem>
        <ElFormItem label="套餐条目" required>
          <ElSelect
            v-model="form.itemIds"
            filterable
            multiple
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
        <ElFormItem label="备注">
          <ElInput v-model="form.remarks" type="textarea" />
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
