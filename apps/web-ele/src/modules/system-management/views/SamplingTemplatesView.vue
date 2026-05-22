<script setup lang="ts">
import type {
  BodyPartNode,
  CreateTemplateRequest,
  TemplateCategoryNode,
  TemplateDetailView,
  TemplateSummaryView,
  UpdateTemplateCategoryRequest,
  UpdateTemplateRequest,
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
  ElTree,
} from 'element-plus';

import {
  createSamplingTemplate,
  createSamplingTemplateCategory,
  deleteSamplingTemplate,
  deleteSamplingTemplateCategory,
  getSamplingTemplateDetail,
  listBodyParts,
  listSamplingTemplates,
  updateSamplingTemplate,
  updateSamplingTemplateCategory,
  updateSamplingTemplateEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import {
  buildTemplateCategorySubmitPayload,
  buildTemplateSubmitPayload,
} from '../utils/submit-payloads';
import { filterTreeByKeyword, findTreeNodeById, flattenTree, getTreeExpandedKeys } from '../utils/tree';

const loading = ref(false);
const detailLoading = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const keyword = ref('');
const treeData = ref<TemplateCategoryNode[]>([]);
const bodyPartTree = ref<BodyPartNode[]>([]);

const selectedCategoryId = ref('');
const selectedTemplate = ref<null | TemplateDetailView>(null);
const categoryDialogVisible = ref(false);
const templateDialogVisible = ref(false);
const categoryDialogMode = ref<'create' | 'edit'>('create');
const templateDialogMode = ref<'create' | 'edit'>('create');

const categoryForm = reactive({
  categoryCode: '',
  categoryName: '',
  enabled: true,
  id: '',
  parentId: '',
  sortOrder: 0,
});

const templateForm = reactive<CreateTemplateRequest & { id?: string }>({
  applicableSpecimenType: '',
  bodyPartIds: [],
  categoryId: '',
  enabled: true,
  id: undefined,
  splitPartCount: 1,
  templateCode: '',
  templateContent: '',
  templateName: '',
});

const filteredTree = computed(() =>
  filterTreeByKeyword(treeData.value, (node) => node.categoryName, keyword.value),
);
const expandedKeys = computed(() => getTreeExpandedKeys(filteredTree.value));
const selectedCategory = computed(() =>
  findTreeNodeById(treeData.value, selectedCategoryId.value),
);
const bodyPartOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];
  flattenTree(bodyPartTree.value, (node) => {
    if ('partName' in node) {
      options.push({ label: node.partName, value: node.id });
    }
  });
  return options;
});

function handleCategorySelection(node?: TemplateCategoryNode) {
  selectedCategoryId.value = node?.id ?? '';
}

function handleTemplateRowClick(row: TemplateSummaryView) {
  void viewTemplateDetail(row.id);
}

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    treeData.value = await listSamplingTemplates();
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

async function loadBodyParts() {
  try {
    bodyPartTree.value = await listBodyParts();
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  }
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

function resetTemplateForm() {
  Object.assign(templateForm, {
    applicableSpecimenType: '',
    bodyPartIds: [],
    categoryId: selectedCategoryId.value,
    enabled: true,
    id: undefined,
    splitPartCount: 1,
    templateCode: '',
    templateContent: '',
    templateName: '',
  });
}

function openCreateCategory(parentId?: string) {
  resetCategoryForm();
  categoryDialogMode.value = 'create';
  categoryForm.parentId = parentId ?? '';
  categoryDialogVisible.value = true;
}

function openEditCategory(node: TemplateCategoryNode) {
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

function openCreateTemplate() {
  resetTemplateForm();
  templateDialogMode.value = 'create';
  templateDialogVisible.value = true;
}

async function openEditTemplate(template: TemplateSummaryView) {
  detailLoading.value = true;
  try {
    const detail = await getSamplingTemplateDetail(template.id);
    selectedTemplate.value = detail;
    resetTemplateForm();
    templateDialogMode.value = 'edit';
    Object.assign(templateForm, {
      applicableSpecimenType: detail.applicableSpecimenType ?? '',
      bodyPartIds: detail.bodyParts.map((item) => item.bodyPartId),
      categoryId: detail.categoryId,
      enabled: detail.enabled,
      id: detail.id,
      splitPartCount: detail.splitPartCount,
      templateCode: detail.templateCode,
      templateContent: detail.templateContent ?? '',
      templateName: detail.templateName,
    });
    templateDialogVisible.value = true;
  } finally {
    detailLoading.value = false;
  }
}

async function viewTemplateDetail(templateId: string) {
  detailLoading.value = true;
  try {
    selectedTemplate.value = await getSamplingTemplateDetail(templateId);
  } finally {
    detailLoading.value = false;
  }
}

async function submitCategory() {
  dialogLoading.value = true;
  try {
    const payload = buildTemplateCategorySubmitPayload(
      categoryForm,
      categoryDialogMode.value,
    );
    if (categoryDialogMode.value === 'create') {
      await createSamplingTemplateCategory(payload);
      ElMessage.success('模板分类已创建');
    } else {
      await updateSamplingTemplateCategory(
        categoryForm.id,
        payload as UpdateTemplateCategoryRequest,
      );
      ElMessage.success('模板分类已更新');
    }
    categoryDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function submitTemplate() {
  dialogLoading.value = true;
  try {
    const payload = buildTemplateSubmitPayload(
      {
        ...templateForm,
        categoryId:
          templateDialogMode.value === 'create'
            ? selectedCategoryId.value
            : templateForm.categoryId,
      },
      templateDialogMode.value,
    );
    if (templateDialogMode.value === 'create') {
      await createSamplingTemplate(payload);
      ElMessage.success('模板已创建');
    } else if (templateForm.id) {
      await updateSamplingTemplate(templateForm.id, payload as UpdateTemplateRequest);
      ElMessage.success('模板已更新');
    }
    templateDialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function toggleTemplateEnabled(template: TemplateSummaryView) {
  await updateSamplingTemplateEnabled(template.id, !template.enabled);
  ElMessage.success('模板状态已更新');
  await loadData();
  await viewTemplateDetail(template.id);
}

async function removeTemplate(template: TemplateSummaryView) {
  await deleteSamplingTemplate(template.id);
  ElMessage.success('模板已删除');
  selectedTemplate.value = null;
  await loadData();
}

async function removeCategory(node: TemplateCategoryNode) {
  await deleteSamplingTemplateCategory(node.id);
  ElMessage.success('分类已删除');
  await loadData();
}

async function loadInitialData() {
  await Promise.all([loadData(), loadBodyParts()]);
}

onMounted(loadInitialData);
</script>

<template>
  <Page
    title="描写模板"
    description="维护描写模板分类、适用部位、分材份数和模板正文，分类编码与模板编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard title="模板分类树" description="搜索并维护模板分类层级。">
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
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
        <SystemSectionCard title="分类与模板列表" description="在选中分类下维护模板明细。">
          <template #extra>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
              @click="openCreateCategory(selectedCategory.id)"
            >
              新增子分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
              @click="openEditCategory(selectedCategory)"
            >
              编辑分类
            </ElButton>
            <ElButton
              v-if="selectedCategory"
              v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
              type="primary"
              @click="openCreateTemplate"
            >
              新增模板
            </ElButton>
          </template>

          <ElTable :data="selectedCategory?.templates ?? []" border @row-click="handleTemplateRowClick">
            <ElTableColumn label="模板编码" min-width="140" prop="templateCode" />
            <ElTableColumn label="模板名称" min-width="180" prop="templateName" />
            <ElTableColumn label="分材份数" width="100" prop="splitPartCount" />
            <ElTableColumn label="部位数" width="100">
              <template #default="scope">
                {{ scope?.row?.bodyParts.length ?? 0 }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="90">
              <template #default="scope">
                <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="180">
              <template #default="scope">
                <div v-if="scope?.row" class="flex flex-wrap gap-2">
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
                    link
                    type="primary"
                    @click.stop="openEditTemplate(scope.row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
                    link
                    type="primary"
                    @click.stop="toggleTemplateEnabled(scope.row)"
                  >
                    {{ scope.row.enabled ? '停用' : '启用' }}
                  </ElButton>
                  <ElButton
                    v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
                    link
                    type="danger"
                    @click.stop="removeTemplate(scope.row)"
                  >
                    删除
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
          <div v-if="selectedCategory" class="mt-4">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.TEMPLATE_CREATE"
              type="danger"
              @click="removeCategory(selectedCategory)"
            >
              删除当前分类
            </ElButton>
          </div>
        </SystemSectionCard>

        <SystemSectionCard title="模板详情" description="点击上方模板行查看详情与部位回显。">
          <ElDescriptions v-if="selectedTemplate" :column="2" border>
            <ElDescriptionsItem label="模板编码">
              {{ selectedTemplate.templateCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="模板名称">
              {{ selectedTemplate.templateName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="分材份数">
              {{ selectedTemplate.splitPartCount }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="适用标本">
              {{ selectedTemplate.applicableSpecimenType || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="selectedTemplate.enabled" />
            </ElDescriptionsItem>
            <ElDescriptionsItem label="适用部位">
              {{ selectedTemplate.bodyParts.map((item) => item.bodyPartName).join('、') || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="模板内容" :span="2">
              <pre class="text-foreground whitespace-pre-wrap text-sm">{{ selectedTemplate.templateContent || '-' }}</pre>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty v-else description="请先选择模板查看详情" />
        </SystemSectionCard>
      </div>
    </div>

    <ElDialog
      v-model="categoryDialogVisible"
      :title="categoryDialogMode === 'create' ? '新增模板分类' : '编辑模板分类'"
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
      v-model="templateDialogVisible"
      :title="templateDialogMode === 'create' ? '新增模板' : '编辑模板'"
      width="760px"
    >
      <ElForm label-width="108px">
        <ElFormItem label="模板名称" required>
          <ElInput v-model="templateForm.templateName" />
        </ElFormItem>
        <ElFormItem label="适用标本">
          <ElInput v-model="templateForm.applicableSpecimenType" />
        </ElFormItem>
        <ElFormItem label="分材份数">
          <ElInputNumber v-model="templateForm.splitPartCount" :min="1" />
        </ElFormItem>
        <ElFormItem label="适用部位">
          <ElSelect
            v-model="templateForm.bodyPartIds"
            filterable
            multiple
            placeholder="请选择部位"
            style="width: 100%"
          >
            <ElOption
              v-for="option in bodyPartOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="模板内容">
          <ElInput v-model="templateForm.templateContent" :rows="8" type="textarea" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="templateForm.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="templateDialogVisible = false">取消</ElButton>
        <ElButton :loading="dialogLoading" type="primary" @click="submitTemplate">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
