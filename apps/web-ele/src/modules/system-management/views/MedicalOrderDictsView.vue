<script setup lang="ts">
import type {
  CreateMedicalOrderCategoryRequest,
  CreateMedicalOrderItemRequest,
  MedicalOrderCategoryNode,
  MedicalOrderItemView,
  UpdateMedicalOrderCategoryRequest,
  UpdateMedicalOrderItemRequest,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
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
  createMedicalOrderCategory,
  createMedicalOrderItem,
  deleteMedicalOrderCategory,
  deleteMedicalOrderItem,
  listMedicalOrderDicts,
  updateMedicalOrderCategory,
  updateMedicalOrderItem,
  updateMedicalOrderItemEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';
import {
  buildMedicalOrderCategorySubmitPayload,
  buildMedicalOrderItemSubmitPayload,
} from '../utils/submit-payloads';
import {
  filterTreeByKeyword,
  findTreeNodeById,
  getTreeExpandedKeys,
} from '../utils/tree';

const loading = ref(false);
const categoryDialogVisible = ref(false);
const itemDialogVisible = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const treeKeyword = ref('');

const treeData = ref<MedicalOrderCategoryNode[]>([]);
const selectedCategoryId = ref('');
const categoryDialogMode = ref<'create' | 'edit'>('create');
const itemDialogMode = ref<'create' | 'edit'>('create');

const categoryForm = reactive<
  CreateMedicalOrderCategoryRequest & { id?: string }
>({
  categoryCode: '',
  categoryName: '',
  enabled: true,
  parentId: '',
  sortOrder: 0,
});

const itemForm = reactive<CreateMedicalOrderItemRequest & { id?: string }>({
  categoryId: '',
  defaultContent: '',
  enabled: true,
  executionScope: '',
  orderItemCode: '',
  orderItemName: '',
  orderType: '',
  sortOrder: 0,
});

const filteredTree = computed(() =>
  filterTreeByKeyword(
    treeData.value,
    (node) => node.categoryName,
    treeKeyword.value,
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
    treeData.value = await listMedicalOrderDicts();
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

function handleCategorySelection(node?: MedicalOrderCategoryNode) {
  selectedCategoryId.value = node?.id ?? '';
}

function resetCategoryForm() {
  Object.assign(categoryForm, {
    categoryCode: '',
    categoryName: '',
    enabled: true,
    id: undefined,
    parentId: '',
    sortOrder: 0,
  });
}

function resetItemForm() {
  Object.assign(itemForm, {
    categoryId: selectedCategoryId.value,
    defaultContent: '',
    enabled: true,
    executionScope: '',
    id: undefined,
    orderItemCode: '',
    orderItemName: '',
    orderType: '',
    sortOrder: 0,
  });
}

function openCreateCategory(parentId?: string) {
  resetCategoryForm();
  categoryDialogMode.value = 'create';
  categoryForm.parentId = parentId ?? '';
  categoryDialogVisible.value = true;
}

function openEditCategory(node: MedicalOrderCategoryNode) {
  resetCategoryForm();
  categoryDialogMode.value = 'edit';
  Object.assign(categoryForm, {
    categoryCode: node.categoryCode,
    categoryName: node.categoryName,
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

function openEditItem(item: MedicalOrderItemView) {
  resetItemForm();
  itemDialogMode.value = 'edit';
  Object.assign(itemForm, {
    categoryId: item.categoryId,
    defaultContent: item.defaultContent ?? '',
    enabled: item.enabled,
    executionScope: item.executionScope ?? '',
    id: item.id,
    orderItemCode: item.orderItemCode,
    orderItemName: item.orderItemName,
    orderType: item.orderType ?? '',
    sortOrder: item.sortOrder,
  });
  itemDialogVisible.value = true;
}

async function submitCategory() {
  dialogLoading.value = true;
  try {
    const payload = buildMedicalOrderCategorySubmitPayload(
      categoryForm,
      categoryDialogMode.value,
    );
    if (categoryDialogMode.value === 'create') {
      await createMedicalOrderCategory(payload);
      ElMessage.success('分类已创建');
    } else if (categoryForm.id) {
      await updateMedicalOrderCategory(
        categoryForm.id,
        payload as UpdateMedicalOrderCategoryRequest,
      );
      ElMessage.success('分类已更新');
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
    const payload = buildMedicalOrderItemSubmitPayload(
      {
        ...itemForm,
        categoryId:
          itemDialogMode.value === 'create'
            ? selectedCategoryId.value
            : itemForm.categoryId,
      },
      itemDialogMode.value,
    );
    if (itemDialogMode.value === 'create') {
      await createMedicalOrderItem(payload);
      ElMessage.success('医嘱条目已创建');
    } else if (itemForm.id) {
      await updateMedicalOrderItem(
        itemForm.id,
        payload as UpdateMedicalOrderItemRequest,
      );
      ElMessage.success('医嘱条目已更新');
    }
    itemDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function removeCategory(node: MedicalOrderCategoryNode) {
  await deleteMedicalOrderCategory(node.id);
  ElMessage.success('分类已删除');
  await loadData();
}

async function toggleItemEnabled(item: MedicalOrderItemView) {
  await updateMedicalOrderItemEnabled(item.id, !item.enabled);
  ElMessage.success('条目状态已更新');
  await loadData();
}

async function removeItem(item: MedicalOrderItemView) {
  await deleteMedicalOrderItem(item.id);
  ElMessage.success('条目已删除');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    title="医嘱字典"
    description="维护医嘱分类、条目、默认内容、执行范围和启停状态，相关编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard
        title="分类树"
        description="新增、编辑和定位医嘱字典分类。"
      >
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
            type="primary"
            @click="openCreateCategory()"
          >
            新增根分类
          </ElButton>
        </template>
        <ElInput v-model="treeKeyword" clearable placeholder="搜索分类名称" />
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
          description="维护分类基础信息与子分类。"
        >
          <template #extra>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
              @click="openCreateCategory(selectedCategory.id)"
            >
              新增子分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
              type="primary"
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
            <ElDescriptionsItem label="排序">
              {{ selectedCategory.sortOrder }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="selectedCategory.enabled" />
            </ElDescriptionsItem>
          </ElDescriptions>
          <div v-if="selectedCategory" class="mt-4">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
              type="danger"
              @click="removeCategory(selectedCategory)"
            >
              删除分类
            </ElButton>
          </div>
          <ElEmpty v-else description="请先选择左侧分类" />
        </SystemSectionCard>

        <SystemSectionCard
          title="医嘱条目"
          description="当前分类下的医嘱条目维护。"
        >
          <template #extra>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
              :disabled="!selectedCategory"
              type="primary"
              @click="openCreateItem"
            >
              新增条目
            </ElButton>
          </template>

          <ElTable :data="selectedCategory?.items ?? []" border>
            <ElTableColumn
              label="条目编码"
              min-width="140"
              prop="orderItemCode"
            />
            <ElTableColumn
              label="条目名称"
              min-width="180"
              prop="orderItemName"
            />
            <ElTableColumn label="医嘱类型" min-width="120">
              <template #default="scope">
                {{ formatNullable(scope?.row?.orderType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="执行范围" min-width="120">
              <template #default="scope">
                {{ formatNullable(scope?.row?.executionScope) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="90">
              <template #default="scope">
                <SystemStatusTag
                  v-if="scope?.row"
                  :enabled="scope.row.enabled"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="180">
              <template #default="scope">
                <div v-if="scope?.row" class="flex flex-wrap gap-2">
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
                    link
                    type="primary"
                    @click="openEditItem(scope.row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
                    link
                    type="primary"
                    @click="toggleItemEnabled(scope.row)"
                  >
                    {{ scope.row.enabled ? '停用' : '启用' }}
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.ORDER_DICT_CREATE"
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
      :title="categoryDialogMode === 'create' ? '新增分类' : '编辑分类'"
      width="620px"
    >
      <ElForm label-width="96px">
        <ElFormItem v-if="categoryDialogMode === 'edit'" label="父分类 ID">
          <ElInput v-model="categoryForm.parentId" placeholder="根分类可留空" />
        </ElFormItem>
        <ElFormItem label="分类名称" required>
          <ElInput v-model="categoryForm.categoryName" />
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
      :title="itemDialogMode === 'create' ? '新增条目' : '编辑条目'"
      width="680px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="所属分类">
          <ElInput v-model="itemForm.categoryId" disabled />
        </ElFormItem>
        <ElFormItem label="条目名称" required>
          <ElInput v-model="itemForm.orderItemName" />
        </ElFormItem>
        <ElFormItem label="医嘱类型">
          <ElInput v-model="itemForm.orderType" />
        </ElFormItem>
        <ElFormItem label="执行范围">
          <ElInput v-model="itemForm.executionScope" />
        </ElFormItem>
        <ElFormItem label="默认内容">
          <ElInput v-model="itemForm.defaultContent" type="textarea" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="itemForm.sortOrder" :min="0" />
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
