<script setup lang="ts">
import type {
  CreateGuidelineRequest,
  GuidelineCategoryNode,
  GuidelineDetailView,
  GuidelineSummaryView,
  UpdateGuidelineCategoryRequest,
  UpdateGuidelineRequest,
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
  createSamplingGuideline,
  createSamplingGuidelineCategory,
  deleteSamplingGuideline,
  deleteSamplingGuidelineCategory,
  getSamplingGuidelineDetail,
  listSamplingGuidelines,
  updateSamplingGuideline,
  updateSamplingGuidelineCategory,
  updateSamplingGuidelineEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import {
  buildGuidelineCategorySubmitPayload,
  buildGuidelineSubmitPayload,
} from '../utils/submit-payloads';
import { filterTreeByKeyword, findTreeNodeById, getTreeExpandedKeys } from '../utils/tree';

const loading = ref(false);
const detailLoading = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const keyword = ref('');
const treeData = ref<GuidelineCategoryNode[]>([]);

const selectedCategoryId = ref('');
const selectedGuideline = ref<GuidelineDetailView | null>(null);
const categoryDialogVisible = ref(false);
const guidelineDialogVisible = ref(false);
const categoryDialogMode = ref<'create' | 'edit'>('create');
const guidelineDialogMode = ref<'create' | 'edit'>('create');

const categoryForm = reactive({
  categoryCode: '',
  categoryName: '',
  enabled: true,
  id: '',
  parentId: '',
  sortOrder: 0,
});

const guidelineForm = reactive<CreateGuidelineRequest & { id?: string }>({
  categoryId: '',
  enabled: true,
  guidelineCode: '',
  guidelineContent: '',
  guidelineName: '',
  id: undefined,
  versionNo: '',
});

const filteredTree = computed(() =>
  filterTreeByKeyword(treeData.value, (node) => node.categoryName, keyword.value),
);
const expandedKeys = computed(() => getTreeExpandedKeys(filteredTree.value));
const selectedCategory = computed(() =>
  findTreeNodeById(treeData.value, selectedCategoryId.value),
);

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    treeData.value = await listSamplingGuidelines();
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

function handleCategorySelection(node?: GuidelineCategoryNode) {
  selectedCategoryId.value = node?.id ?? '';
}

function handleGuidelineRowClick(row: GuidelineSummaryView) {
  void viewGuidelineDetail(row.id);
}

function resetCategoryForm() {
  Object.assign(categoryForm, {
    categoryCode: '',
    categoryName: '',
    enabled: true,
    id: '',
    parentId: '',
    sortOrder: 0,
  });
}

function resetGuidelineForm() {
  Object.assign(guidelineForm, {
    categoryId: selectedCategoryId.value,
    enabled: true,
    guidelineCode: '',
    guidelineContent: '',
    guidelineName: '',
    id: undefined,
    versionNo: '',
  });
}

function openCreateCategory(parentId?: string) {
  resetCategoryForm();
  categoryDialogMode.value = 'create';
  categoryForm.parentId = parentId ?? '';
  categoryDialogVisible.value = true;
}

function openEditCategory(node: GuidelineCategoryNode) {
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

function openCreateGuideline() {
  resetGuidelineForm();
  guidelineDialogMode.value = 'create';
  guidelineDialogVisible.value = true;
}

async function openEditGuideline(guideline: GuidelineSummaryView) {
  detailLoading.value = true;
  try {
    const detail = await getSamplingGuidelineDetail(guideline.id);
    selectedGuideline.value = detail;
    resetGuidelineForm();
    guidelineDialogMode.value = 'edit';
    Object.assign(guidelineForm, {
      categoryId: detail.categoryId,
      enabled: detail.enabled,
      guidelineCode: detail.guidelineCode,
      guidelineContent: detail.guidelineContent ?? '',
      guidelineName: detail.guidelineName,
      id: detail.id,
      versionNo: detail.versionNo ?? '',
    });
    guidelineDialogVisible.value = true;
  } finally {
    detailLoading.value = false;
  }
}

async function viewGuidelineDetail(id: string) {
  detailLoading.value = true;
  try {
    selectedGuideline.value = await getSamplingGuidelineDetail(id);
  } finally {
    detailLoading.value = false;
  }
}

async function submitCategory() {
  dialogLoading.value = true;
  try {
    const payload = buildGuidelineCategorySubmitPayload(
      categoryForm,
      categoryDialogMode.value,
    );
    if (categoryDialogMode.value === 'create') {
      await createSamplingGuidelineCategory(payload);
      ElMessage.success('规范分类已创建');
    } else {
      await updateSamplingGuidelineCategory(
        categoryForm.id,
        payload as UpdateGuidelineCategoryRequest,
      );
      ElMessage.success('规范分类已更新');
    }
    categoryDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function submitGuideline() {
  dialogLoading.value = true;
  try {
    const payload = buildGuidelineSubmitPayload(
      {
        ...guidelineForm,
        categoryId:
          guidelineDialogMode.value === 'create'
            ? selectedCategoryId.value
            : guidelineForm.categoryId,
      },
      guidelineDialogMode.value,
    );
    if (guidelineDialogMode.value === 'create') {
      await createSamplingGuideline(payload);
      ElMessage.success('规范已创建');
    } else if (guidelineForm.id) {
      await updateSamplingGuideline(guidelineForm.id, payload as UpdateGuidelineRequest);
      ElMessage.success('规范已更新');
    }
    guidelineDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function toggleGuidelineEnabled(guideline: GuidelineSummaryView) {
  await updateSamplingGuidelineEnabled(guideline.id, !guideline.enabled);
  ElMessage.success('规范状态已更新');
  await loadData();
  await viewGuidelineDetail(guideline.id);
}

async function removeGuideline(guideline: GuidelineSummaryView) {
  await deleteSamplingGuideline(guideline.id);
  ElMessage.success('规范已删除');
  selectedGuideline.value = null;
  await loadData();
}

async function removeCategory(node: GuidelineCategoryNode) {
  await deleteSamplingGuidelineCategory(node.id);
  ElMessage.success('分类已删除');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    title="取材规范"
    description="维护规范分类树与规范详情，支持新建分类、规范、启停与详情查看，相关编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard title="规范分类树" description="搜索并维护取材规范分类层级。">
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
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
        <SystemSectionCard title="分类与规范列表" description="维护当前分类下的规范明细。">
          <template #extra>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
              @click="openCreateCategory(selectedCategory.id)"
            >
              新增子分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
              @click="openEditCategory(selectedCategory)"
            >
              编辑分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
              type="primary"
              @click="openCreateGuideline"
            >
              新增规范
            </ElButton>
          </template>

          <ElTable :data="selectedCategory?.guidelines ?? []" border @row-click="handleGuidelineRowClick">
            <ElTableColumn label="规范编码" min-width="140" prop="guidelineCode" />
            <ElTableColumn label="规范名称" min-width="180" prop="guidelineName" />
            <ElTableColumn label="版本号" min-width="120" prop="versionNo" />
            <ElTableColumn label="状态" width="90">
              <template #default="scope">
                <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="180">
              <template #default="scope">
                <div v-if="scope?.row" class="flex flex-wrap gap-2">
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
                    link
                    type="primary"
                    @click.stop="openEditGuideline(scope.row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
                    link
                    type="primary"
                    @click.stop="toggleGuidelineEnabled(scope.row)"
                  >
                    {{ scope.row.enabled ? '停用' : '启用' }}
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
                    link
                    type="danger"
                    @click.stop="removeGuideline(scope.row)"
                  >
                    删除
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
          <div v-if="selectedCategory" class="mt-4">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.GUIDELINE_CREATE"
              type="danger"
              @click="removeCategory(selectedCategory)"
            >
              删除当前分类
            </ElButton>
          </div>
        </SystemSectionCard>

        <SystemSectionCard title="规范详情" description="点击上方规范行查看正文内容。">
          <ElDescriptions v-if="selectedGuideline" :column="2" border>
            <ElDescriptionsItem label="规范编码">
              {{ selectedGuideline.guidelineCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="规范名称">
              {{ selectedGuideline.guidelineName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="版本号">
              {{ selectedGuideline.versionNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="selectedGuideline.enabled" />
            </ElDescriptionsItem>
            <ElDescriptionsItem label="规范内容" :span="2">
              <pre class="text-foreground whitespace-pre-wrap text-sm">{{ selectedGuideline.guidelineContent || '-' }}</pre>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty v-else description="请先选择规范查看详情" />
        </SystemSectionCard>
      </div>
    </div>

    <ElDialog
      v-model="categoryDialogVisible"
      :title="categoryDialogMode === 'create' ? '新增规范分类' : '编辑规范分类'"
      width="620px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="父分类 ID">
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
        <ElButton :loading="dialogLoading" type="primary" @click="submitCategory">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="guidelineDialogVisible"
      :title="guidelineDialogMode === 'create' ? '新增规范' : '编辑规范'"
      width="760px"
    >
      <ElForm label-width="108px">
        <ElFormItem label="规范名称" required>
          <ElInput v-model="guidelineForm.guidelineName" />
        </ElFormItem>
        <ElFormItem label="版本号">
          <ElInput v-model="guidelineForm.versionNo" />
        </ElFormItem>
        <ElFormItem label="规范内容">
          <ElInput v-model="guidelineForm.guidelineContent" :rows="8" type="textarea" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="guidelineForm.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="guidelineDialogVisible = false">取消</ElButton>
        <ElButton :loading="dialogLoading" type="primary" @click="submitGuideline">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
