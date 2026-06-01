<script setup lang="ts">
import type {
  ConfigCategoryNode,
  ConfigItemView,
  CreateConfigItemRequest,
  UpdateConfigCategoryRequest,
  UpdateConfigItemRequest,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTree,
} from 'element-plus';

import {
  createSystemConfigCategory,
  createSystemConfigItem,
  deleteSystemConfigCategory,
  deleteSystemConfigItem,
  listSystemConfigs,
  updateSystemConfigCategory,
  updateSystemConfigItem,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { buildConfigCategorySubmitPayload } from '../utils/submit-payloads';
import {
  filterTreeByKeyword,
  findTreeNodeById,
  getTreeExpandedKeys,
} from '../utils/tree';

const loading = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const keyword = ref('');
const treeData = ref<ConfigCategoryNode[]>([]);
const selectedCategoryId = ref('');

const categoryDialogVisible = ref(false);
const itemDialogVisible = ref(false);
const categoryDialogMode = ref<'create' | 'edit'>('create');
const itemDialogMode = ref<'create' | 'edit'>('create');

const categoryForm = reactive({
  categoryCode: '',
  categoryName: '',
  categoryType: '',
  enabled: true,
  id: '',
  parentId: '',
  sortOrder: 0,
});

const itemForm = reactive<CreateConfigItemRequest & { id?: string }>({
  categoryId: '',
  configKey: '',
  configName: '',
  configValue: '',
  enabled: true,
  id: undefined,
  remarks: '',
  sortOrder: 0,
  valueType: '',
});

const filteredTree = computed(() =>
  filterTreeByKeyword(
    treeData.value,
    (node) => node.categoryName,
    keyword.value,
  ),
);
const expandedKeys = computed(() => getTreeExpandedKeys(filteredTree.value));
const selectedCategory = computed(() =>
  findTreeNodeById(treeData.value, selectedCategoryId.value),
);

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    treeData.value = await listSystemConfigs();
    const firstNode = treeData.value[0];
    if (!selectedCategoryId.value && firstNode) {
      selectedCategoryId.value = firstNode.id;
    }
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleCategorySelection(node?: ConfigCategoryNode) {
  selectedCategoryId.value = node?.id ?? '';
}

function resetCategoryForm() {
  Object.assign(categoryForm, {
    categoryCode: '',
    categoryName: '',
    categoryType: '',
    enabled: true,
    id: '',
    parentId: '',
    sortOrder: 0,
  });
}

function resetItemForm() {
  Object.assign(itemForm, {
    categoryId: selectedCategoryId.value,
    configKey: '',
    configName: '',
    configValue: '',
    enabled: true,
    id: undefined,
    remarks: '',
    sortOrder: 0,
    valueType: '',
  });
}

function openCreateCategory(parentId?: string) {
  resetCategoryForm();
  categoryDialogMode.value = 'create';
  categoryForm.parentId = parentId ?? '';
  categoryDialogVisible.value = true;
}

function openEditCategory(node: ConfigCategoryNode) {
  resetCategoryForm();
  categoryDialogMode.value = 'edit';
  Object.assign(categoryForm, {
    categoryCode: node.categoryCode,
    categoryName: node.categoryName,
    categoryType: node.categoryType ?? '',
    enabled: node.enabled,
    id: node.id,
    parentId: node.parentId ?? '',
    sortOrder: node.sortOrder,
  });
  categoryDialogVisible.value = true;
}

function openCreateItem() {
  resetItemForm();
  itemDialogMode.value = 'create';
  itemDialogVisible.value = true;
}

function openEditItem(item: ConfigItemView) {
  resetItemForm();
  itemDialogMode.value = 'edit';
  Object.assign(itemForm, {
    categoryId: item.categoryId,
    configKey: item.configKey,
    configName: item.configName,
    configValue: item.configValue ?? '',
    enabled: item.enabled,
    id: item.id,
    remarks: item.remarks ?? '',
    sortOrder: item.sortOrder,
    valueType: item.valueType ?? '',
  });
  itemDialogVisible.value = true;
}

async function submitCategory() {
  dialogLoading.value = true;
  try {
    const payload = buildConfigCategorySubmitPayload(
      categoryForm,
      categoryDialogMode.value,
    );
    if (categoryDialogMode.value === 'create') {
      await createSystemConfigCategory(payload);
      ElMessage.success('配置分类已创建');
    } else {
      await updateSystemConfigCategory(
        categoryForm.id,
        payload as UpdateConfigCategoryRequest,
      );
      ElMessage.success('配置分类已更新');
    }
    categoryDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function submitItem() {
  dialogLoading.value = true;
  try {
    if (itemDialogMode.value === 'create') {
      await createSystemConfigItem({
        categoryId: selectedCategoryId.value,
        configKey: itemForm.configKey,
        configName: itemForm.configName,
        configValue: itemForm.configValue || null,
        enabled: itemForm.enabled,
        remarks: itemForm.remarks || null,
        sortOrder: itemForm.sortOrder,
        valueType: itemForm.valueType || null,
      });
      ElMessage.success('配置项已创建');
    } else if (itemForm.id) {
      await updateSystemConfigItem(itemForm.id, {
        configValue: itemForm.configValue || null,
        enabled: itemForm.enabled,
        remarks: itemForm.remarks || null,
      } satisfies UpdateConfigItemRequest);
      ElMessage.success('配置项已更新');
    }
    itemDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function removeCategory(node: ConfigCategoryNode) {
  await deleteSystemConfigCategory(node.id);
  ElMessage.success('分类已删除');
  await loadData();
}

async function removeItem(item: ConfigItemView) {
  await deleteSystemConfigItem(item.id);
  ElMessage.success('配置项已删除');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    title="系统配置"
    description="维护配置分类树与配置项列表，分类编码由系统自动生成，支持创建分类、配置项，以及更新配置值。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard
        title="配置分类树"
        description="搜索配置分类并切换配置项列表。"
      >
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
            type="primary"
            @click="openCreateCategory()"
          >
            新增分类
          </ElButton>
        </template>
        <ElInput v-model="keyword" clearable placeholder="搜索分类名称" />
        <ElTree
          v-loading="loading"
          :current-node-key="selectedCategoryId"
          :data="filteredTree"
          :default-expanded-keys="expandedKeys"
          node-key="id"
          class="mt-4"
          :props="{ children: 'children', label: 'categoryName' }"
          @current-change="handleCategorySelection"
          @node-click="handleCategorySelection"
        />
      </SystemSectionCard>

      <div class="flex flex-col gap-4">
        <SystemSectionCard
          title="分类详情"
          description="维护分类基础信息和子分类。"
        >
          <template #extra>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
              @click="openCreateCategory(selectedCategory.id)"
            >
              新增子分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
              @click="openEditCategory(selectedCategory)"
            >
              编辑分类
            </ElButton>
          </template>
          <ElDescriptions v-if="selectedCategory" :column="2" border>
            <ElDescriptionsItem label="分类编码">
              {{ selectedCategory.categoryCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="分类名称">
              {{ selectedCategory.categoryName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="分类类型">
              {{ selectedCategory.categoryType || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="selectedCategory.enabled" />
            </ElDescriptionsItem>
          </ElDescriptions>
          <div v-if="selectedCategory" class="mt-4">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
              type="danger"
              @click="removeCategory(selectedCategory)"
            >
              删除当前分类
            </ElButton>
          </div>
        </SystemSectionCard>

        <SystemSectionCard
          title="配置项列表"
          description="更新配置值、备注和启停状态。"
        >
          <template #extra>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
              :disabled="!selectedCategory"
              type="primary"
              @click="openCreateItem"
            >
              新增配置项
            </ElButton>
          </template>

          <ElTable :data="selectedCategory?.items ?? []" border>
            <ElTableColumn label="配置键" min-width="160" prop="configKey" />
            <ElTableColumn label="配置名称" min-width="180" prop="configName" />
            <ElTableColumn label="配置值" min-width="180" prop="configValue" />
            <ElTableColumn label="值类型" min-width="120" prop="valueType" />
            <ElTableColumn label="状态" width="90">
              <template #default="scope">
                <SystemStatusTag
                  v-if="scope?.row"
                  :enabled="scope.row.enabled"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="150">
              <template #default="scope">
                <div v-if="scope?.row" class="flex gap-2">
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
                    link
                    type="primary"
                    @click="openEditItem(scope.row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
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
        </SystemSectionCard>
      </div>
    </div>

    <ElDialog
      v-model="categoryDialogVisible"
      :title="categoryDialogMode === 'create' ? '新增配置分类' : '编辑配置分类'"
      width="620px"
    >
      <ElForm label-width="96px">
        <ElFormItem v-if="categoryDialogMode === 'edit'" label="父分类 ID">
          <ElInput v-model="categoryForm.parentId" placeholder="根分类可留空" />
        </ElFormItem>
        <ElFormItem label="分类名称" required>
          <ElInput v-model="categoryForm.categoryName" />
        </ElFormItem>
        <ElFormItem label="分类类型">
          <ElInput v-model="categoryForm.categoryType" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="categoryForm.sortOrder" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="categoryForm.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="categoryDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="dialogLoading"
          type="primary"
          @click="submitCategory"
        >
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="itemDialogVisible"
      :title="itemDialogMode === 'create' ? '新增配置项' : '编辑配置项'"
      width="700px"
    >
      <ElForm label-width="108px">
        <ElFormItem label="配置键" required>
          <ElInput
            v-model="itemForm.configKey"
            :disabled="itemDialogMode === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="配置名称" required>
          <ElInput
            v-model="itemForm.configName"
            :disabled="itemDialogMode === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="配置值">
          <ElInput v-model="itemForm.configValue" type="textarea" />
        </ElFormItem>
        <ElFormItem label="值类型">
          <ElInput
            v-model="itemForm.valueType"
            :disabled="itemDialogMode === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber
            v-model="itemForm.sortOrder"
            :disabled="itemDialogMode === 'edit'"
            :min="0"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="itemForm.remarks" type="textarea" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="itemForm.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="itemDialogVisible = false">取消</ElButton>
        <ElButton :loading="dialogLoading" type="primary" @click="submitItem">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
