<script setup lang="ts">
import type {
  CreateDepartmentRequest,
  DepartmentNode,
  UpdateDepartmentRequest,
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
  ElTree,
} from 'element-plus';

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  updateDepartmentEnabled,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';
import {
  filterTreeByKeyword,
  findTreeNodeById,
  getTreeExpandedKeys,
} from '../utils/tree';

const loading = ref(false);
const dialogLoading = ref(false);
const pageError = ref('');
const keyword = ref('');
const treeData = ref<DepartmentNode[]>([]);
const selectedNodeId = ref('');
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');

const form = reactive<CreateDepartmentRequest & { id?: string }>({
  departmentCode: '',
  departmentName: '',
  enabled: true,
  parentId: '',
  sortOrder: 0,
});

const filteredTree = computed(() =>
  filterTreeByKeyword(treeData.value, (node) => node.departmentName, keyword.value),
);
const expandedKeys = computed(() => getTreeExpandedKeys(filteredTree.value));
const selectedNode = computed(() =>
  findTreeNodeById(treeData.value, selectedNodeId.value),
);

function resetForm() {
  Object.assign(form, {
    departmentCode: '',
    departmentName: '',
    enabled: true,
    id: undefined,
    parentId: '',
    sortOrder: 0,
  });
}

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    treeData.value = await listDepartments();
    const firstNode = treeData.value[0];
    if (!selectedNodeId.value && firstNode) {
      selectedNodeId.value = firstNode.id;
    }
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleTreeSelection(node?: DepartmentNode) {
  selectedNodeId.value = node?.id ?? '';
}

function openCreateDialog(parentId?: string) {
  resetForm();
  dialogMode.value = 'create';
  form.parentId = parentId ?? '';
  dialogVisible.value = true;
}

function openEditDialog(node: DepartmentNode) {
  resetForm();
  dialogMode.value = 'edit';
  Object.assign(form, {
    departmentCode: node.departmentCode,
    departmentName: node.departmentName,
    enabled: node.enabled,
    id: node.id,
    parentId: node.parentId ?? '',
    sortOrder: node.sortOrder,
  });
  dialogVisible.value = true;
}

async function submitForm() {
  dialogLoading.value = true;
  try {
    if (dialogMode.value === 'create') {
      await createDepartment({
        departmentCode: form.departmentCode,
        departmentName: form.departmentName,
        enabled: form.enabled,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('科室节点已创建');
    } else if (form.id) {
      await updateDepartment(form.id, {
        departmentCode: form.departmentCode,
        departmentName: form.departmentName,
        enabled: form.enabled,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
      } satisfies UpdateDepartmentRequest);
      ElMessage.success('科室节点已更新');
    }
    dialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function toggleNodeEnabled(node: DepartmentNode) {
  await updateDepartmentEnabled(node.id, !node.enabled);
  ElMessage.success('节点状态已更新');
  await loadData();
}

async function removeNode(node: DepartmentNode) {
  await deleteDepartment(node.id);
  ElMessage.success('节点已删除');
  if (selectedNodeId.value === node.id) {
    selectedNodeId.value = '';
  }
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    title="科室字典"
    description="维护科室层级、编码、排序和启停状态，供流程页下拉选择统一复用。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard title="科室树" description="搜索并切换科室节点。">
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.DEPARTMENT_CREATE"
            type="primary"
            @click="openCreateDialog()"
          >
            新增根节点
          </ElButton>
        </template>
        <ElInput v-model="keyword" clearable placeholder="搜索科室名称" />
        <ElTree
          v-loading="loading"
          :current-node-key="selectedNodeId"
          :data="filteredTree"
          :default-expanded-keys="expandedKeys"
          node-key="id"
          class="mt-4"
          :props="{ children: 'children', label: 'departmentName' }"
          @current-change="handleTreeSelection"
          @node-click="handleTreeSelection"
        />
      </SystemSectionCard>

      <SystemSectionCard title="节点详情" description="展示当前选中节点信息，并提供子节点维护入口。">
        <template #extra>
          <ElButton
            v-if="selectedNode"
            v-access:code="M1_PERMISSION_CODES.DEPARTMENT_CREATE"
            @click="openCreateDialog(selectedNode.id)"
          >
            新增子节点
          </ElButton>
        </template>

        <template v-if="selectedNode">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="科室名称">
              {{ selectedNode.departmentName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="科室编码">
              {{ selectedNode.departmentCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="父节点 ID">
              {{ formatNullable(selectedNode.parentId) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="排序号">
              {{ selectedNode.sortOrder }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="selectedNode.enabled" />
            </ElDescriptionsItem>
          </ElDescriptions>

          <div class="mt-4 flex flex-wrap gap-2">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.DEPARTMENT_CREATE"
              type="primary"
              @click="openEditDialog(selectedNode)"
            >
              编辑
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.DEPARTMENT_CREATE"
              @click="toggleNodeEnabled(selectedNode)"
            >
              {{ selectedNode.enabled ? '停用' : '启用' }}
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.DEPARTMENT_CREATE"
              type="danger"
              @click="removeNode(selectedNode)"
            >
              删除
            </ElButton>
          </div>
        </template>
        <ElEmpty v-else description="请选择左侧科室节点" />
      </SystemSectionCard>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增科室节点' : '编辑科室节点'"
      width="520px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="父节点 ID">
          <ElInput v-model="form.parentId" placeholder="根节点可留空" />
        </ElFormItem>
        <ElFormItem label="科室编码" required>
          <ElInput v-model="form.departmentCode" placeholder="请输入科室编码" />
        </ElFormItem>
        <ElFormItem label="科室名称" required>
          <ElInput v-model="form.departmentName" placeholder="请输入科室名称" />
        </ElFormItem>
        <ElFormItem label="排序号">
          <ElInputNumber v-model="form.sortOrder" :min="0" class="w-full" />
        </ElFormItem>
        <ElFormItem label="是否启用">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton :loading="dialogLoading" type="primary" @click="submitForm">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </Page>
</template>
