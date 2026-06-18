<script setup lang="ts">
import type {
  ConfigCategoryNode,
  ConfigItemView,
  CreateConfigItemRequest,
  CreateSpecimenDictionaryItemRequest,
  DepartmentNode,
  SpecimenDictionaryItemView,
  SpecimenDictionaryPartCategoryView,
  SpecimenDictionarySystemCategoryView,
  SpecimenDictionaryTreeView,
  UpdateConfigCategoryRequest,
  UpdateConfigItemRequest,
  UpdateSpecimenDictionaryCategoryRequest,
  UpdateSpecimenDictionaryItemRequest,
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
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTree,
} from 'element-plus';

import {
  createSpecimenDictionaryCategory,
  createSpecimenDictionaryItem,
  createSystemConfigCategory,
  createSystemConfigItem,
  deleteSpecimenDictionaryCategory,
  deleteSpecimenDictionaryItem,
  deleteSystemConfigCategory,
  deleteSystemConfigItem,
  getSpecimenDictionaryConfigTree,
  listDepartments,
  listSystemConfigs,
  updateSpecimenDictionaryCategory,
  updateSpecimenDictionaryItem,
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
  flattenTree,
  getTreeExpandedKeys,
} from '../utils/tree';

const SPECIMEN_DICTIONARY_ROOT_CODE = 'SPECIMEN_DICTIONARY';
const SPECIMEN_DICTIONARY_CATEGORY_TYPE = 'SPECIMEN_DICTIONARY';

const loading = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const keyword = ref('');
const treeData = ref<ConfigCategoryNode[]>([]);
const specimenDictionaryTree = ref<SpecimenDictionaryTreeView>({
  items: [],
  systems: [],
});
const departmentTree = ref<DepartmentNode[]>([]);
const selectedCategoryId = ref('');

const categoryDialogVisible = ref(false);
const itemDialogVisible = ref(false);
const specimenItemDialogVisible = ref(false);
const categoryDialogMode = ref<'create' | 'edit'>('create');
const itemDialogMode = ref<'create' | 'edit'>('create');
const specimenItemDialogMode = ref<'create' | 'edit'>('create');

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

const specimenItemForm = reactive<
  CreateSpecimenDictionaryItemRequest & { id?: string }
>({
  configKey: '',
  departmentIds: [],
  enabled: true,
  id: undefined,
  partCategoryId: '',
  remarks: '',
  sortOrder: 0,
  specimenName: '',
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
const isSpecimenDictionaryNode = computed(
  () =>
    selectedCategory.value?.categoryType === SPECIMEN_DICTIONARY_CATEGORY_TYPE,
);
const isSpecimenDictionaryRootSelected = computed(
  () => selectedCategory.value?.categoryCode === SPECIMEN_DICTIONARY_ROOT_CODE,
);
const specimenDictionarySystems = computed(
  () => specimenDictionaryTree.value.systems,
);
const selectedSpecimenSystem =
  computed<null | SpecimenDictionarySystemCategoryView>(
    () =>
      specimenDictionarySystems.value.find(
        (system) => system.id === selectedCategoryId.value,
      ) ?? null,
  );
const selectedSpecimenPart =
  computed<null | SpecimenDictionaryPartCategoryView>(
    () =>
      specimenDictionarySystems.value
        .flatMap((system) => system.parts)
        .find((part) => part.id === selectedCategoryId.value) ?? null,
  );
const specimenDictionaryItems = computed(() => {
  if (selectedSpecimenPart.value) {
    return selectedSpecimenPart.value.items;
  }
  if (selectedSpecimenSystem.value) {
    return selectedSpecimenSystem.value.parts.flatMap((part) => part.items);
  }
  if (isSpecimenDictionaryRootSelected.value) {
    return specimenDictionaryTree.value.items;
  }
  return [];
});
const departmentOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];
  flattenTree(departmentTree.value, (node) => {
    if ('departmentName' in node) {
      options.push({ label: node.departmentName, value: node.id });
    }
  });
  return options;
});
const departmentNameById = computed(() => {
  const map = new Map<string, string>();
  for (const option of departmentOptions.value) {
    map.set(option.value, option.label);
  }
  return map;
});
const shouldShowConfigValueColumn = computed(() =>
  (selectedCategory.value?.items ?? []).some((item) => !isInternalDisplayValue(item)),
);

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    const [configs, specimenTree, departments] = await Promise.all([
      listSystemConfigs(),
      getSpecimenDictionaryConfigTree(),
      listDepartments(),
    ]);
    treeData.value = configs;
    specimenDictionaryTree.value = specimenTree;
    departmentTree.value = departments;
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

function resetSpecimenItemForm() {
  Object.assign(specimenItemForm, {
    configKey: '',
    departmentIds: [],
    enabled: true,
    id: undefined,
    partCategoryId: selectedSpecimenPart.value?.id ?? '',
    remarks: '',
    sortOrder: 0,
    specimenName: '',
  });
}

function openCreateCategory(parentId?: string) {
  resetCategoryForm();
  categoryDialogMode.value = 'create';
  categoryForm.parentId = parentId ?? '';
  categoryForm.categoryType = isSpecimenDictionaryNode.value
    ? SPECIMEN_DICTIONARY_CATEGORY_TYPE
    : '';
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

function openCreateSpecimenItem() {
  resetSpecimenItemForm();
  specimenItemDialogMode.value = 'create';
  specimenItemDialogVisible.value = true;
}

function openEditSpecimenItem(item: SpecimenDictionaryItemView) {
  resetSpecimenItemForm();
  specimenItemDialogMode.value = 'edit';
  Object.assign(specimenItemForm, {
    configKey: item.configKey,
    departmentIds: [...item.departmentIds],
    enabled: item.enabled,
    id: item.id,
    partCategoryId: item.partCategoryId,
    remarks: item.remarks ?? '',
    sortOrder: item.sortOrder,
    specimenName: item.specimenName,
  });
  specimenItemDialogVisible.value = true;
}

async function submitCategory() {
  dialogLoading.value = true;
  try {
    const isSpecimenDictionaryCategory =
      categoryForm.categoryType === SPECIMEN_DICTIONARY_CATEGORY_TYPE;
    const payload = buildConfigCategorySubmitPayload(
      categoryForm,
      categoryDialogMode.value,
    );
    if (categoryDialogMode.value === 'create') {
      if (isSpecimenDictionaryCategory) {
        await createSpecimenDictionaryCategory(payload);
        ElMessage.success('标本字典分类已创建');
      } else {
        await createSystemConfigCategory(payload);
        ElMessage.success('配置分类已创建');
      }
    } else if (isSpecimenDictionaryCategory) {
      await updateSpecimenDictionaryCategory(
        categoryForm.id,
        payload as UpdateSpecimenDictionaryCategoryRequest,
      );
      ElMessage.success('标本字典分类已更新');
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

async function submitSpecimenItem() {
  dialogLoading.value = true;
  try {
    if (specimenItemDialogMode.value === 'create') {
      await createSpecimenDictionaryItem({
        configKey: specimenItemForm.configKey,
        departmentIds: specimenItemForm.departmentIds,
        enabled: specimenItemForm.enabled,
        partCategoryId: specimenItemForm.partCategoryId,
        remarks: specimenItemForm.remarks || null,
        sortOrder: specimenItemForm.sortOrder,
        specimenName: specimenItemForm.specimenName,
      });
      ElMessage.success('标本字典项已创建');
    } else if (specimenItemForm.id) {
      await updateSpecimenDictionaryItem(specimenItemForm.id, {
        departmentIds: specimenItemForm.departmentIds,
        enabled: specimenItemForm.enabled,
        remarks: specimenItemForm.remarks || null,
        sortOrder: specimenItemForm.sortOrder,
        specimenName: specimenItemForm.specimenName,
      } satisfies UpdateSpecimenDictionaryItemRequest);
      ElMessage.success('标本字典项已更新');
    }
    specimenItemDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function removeCategory(node: ConfigCategoryNode) {
  if (node.categoryType === SPECIMEN_DICTIONARY_CATEGORY_TYPE) {
    await deleteSpecimenDictionaryCategory(node.id);
    ElMessage.success('标本字典分类已删除');
  } else {
    await deleteSystemConfigCategory(node.id);
    ElMessage.success('分类已删除');
  }
  await loadData();
}

async function removeItem(item: ConfigItemView) {
  await deleteSystemConfigItem(item.id);
  ElMessage.success('配置项已删除');
  await loadData();
}

async function removeSpecimenItem(item: SpecimenDictionaryItemView) {
  await deleteSpecimenDictionaryItem(item.id);
  ElMessage.success('标本字典项已删除');
  await loadData();
}

function resolveDepartmentNames(departmentIds: string[]) {
  return (departmentIds ?? []).map(
    (departmentId) =>
      departmentNameById.value.get(departmentId) ?? departmentId,
  );
}

function isInternalDisplayValue(item: ConfigItemView) {
  const configValue = item.configValue?.trim();
  const valueType = item.valueType?.trim().toUpperCase();

  if (!configValue) {
    return false;
  }

  if (valueType && valueType !== 'STRING') {
    return false;
  }

  const internalValuePattern = /^[A-Z0-9]+(?:[._-][A-Z0-9]+)+$/;
  return internalValuePattern.test(configValue);
}

onMounted(loadData);
</script>

<template>
  <Page
    :show-header="false"
    title="系统配置"
    description="维护通用配置树，以及标本字典的系统/部位/标本项与科室关联。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard
        title="配置分类树"
        description="搜索配置分类并切换右侧工作区。"
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
        <template v-if="isSpecimenDictionaryNode">
          <SystemSectionCard
            title="标本字典分类详情"
            description="维护标本字典系统/部位分类，并在部位下管理标本项。"
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
              <ElDescriptionsItem label="分类名称">
                {{ selectedCategory.categoryName }}
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
            title="标本字典项"
            description="在当前系统或部位范围内维护标本项与科室关联。"
          >
            <template #extra>
              <ElButton
                v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
                :disabled="!selectedSpecimenPart"
                type="primary"
                @click="openCreateSpecimenItem"
              >
                新增标本项
              </ElButton>
            </template>
            <ElTable :data="specimenDictionaryItems" border>
              <ElTableColumn
                label="标本名称"
                min-width="220"
                prop="specimenName"
              />
              <ElTableColumn label="排序" min-width="90" prop="sortOrder" />
              <ElTableColumn label="关联科室" min-width="260">
                <template #default="scope">
                  <div v-if="scope?.row" class="flex flex-wrap gap-2">
                    <ElTag
                      v-for="departmentName in resolveDepartmentNames(
                        scope.row.departmentIds,
                      )"
                      :key="departmentName"
                      size="small"
                    >
                      {{ departmentName }}
                    </ElTag>
                  </div>
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
              <ElTableColumn fixed="right" label="操作" min-width="150">
                <template #default="scope">
                  <div v-if="scope?.row" class="flex gap-2">
                    <ElButton
                      v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
                      link
                      type="primary"
                      @click="openEditSpecimenItem(scope.row)"
                    >
                      编辑
                    </ElButton>
                    <ElButton
                      v-access:code="M1_PERMISSION_CODES.CONFIG_UPDATE"
                      link
                      type="danger"
                      @click="removeSpecimenItem(scope.row)"
                    >
                      删除
                    </ElButton>
                  </div>
                </template>
              </ElTableColumn>
            </ElTable>
          </SystemSectionCard>
        </template>

        <template v-else>
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
              <ElDescriptionsItem label="分类名称">
                {{ selectedCategory.categoryName }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="状态">
                <SystemStatusTag :enabled="selectedCategory.enabled" />
              </ElDescriptionsItem>
            </ElDescriptions>
            <ElEmpty v-else description="请选择左侧配置分类" />
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
              <ElTableColumn
                label="配置名称"
                min-width="180"
                prop="configName"
              />
              <ElTableColumn
                v-if="shouldShowConfigValueColumn"
                label="配置值"
                min-width="180"
              >
                <template #default="scope">
                  <span v-if="scope?.row && !isInternalDisplayValue(scope.row)">
                    {{ scope.row.configValue || '-' }}
                  </span>
                  <span v-else>-</span>
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
        </template>
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
        <ElFormItem v-if="!isSpecimenDictionaryNode" label="分类类型">
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

    <ElDialog
      v-model="specimenItemDialogVisible"
      :title="
        specimenItemDialogMode === 'create'
          ? '新增标本字典项'
          : '编辑标本字典项'
      "
      width="760px"
    >
      <ElForm label-width="108px">
        <ElFormItem label="配置键" required>
          <ElInput
            v-model="specimenItemForm.configKey"
            :disabled="specimenItemDialogMode === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="标本名称" required>
          <ElInput v-model="specimenItemForm.specimenName" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="specimenItemForm.sortOrder" :min="0" />
        </ElFormItem>
        <ElFormItem label="关联科室" required>
          <ElSelect
            v-model="specimenItemForm.departmentIds"
            clearable
            filterable
            multiple
            placeholder="请选择关联科室"
            style="width: 100%"
          >
            <ElOption
              v-for="option in departmentOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="specimenItemForm.remarks" type="textarea" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="specimenItemForm.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="specimenItemDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="dialogLoading"
          type="primary"
          @click="submitSpecimenItem"
        >
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
