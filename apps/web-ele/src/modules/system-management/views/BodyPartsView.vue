<script setup lang="ts">
import type {
  BodyPartNode,
  CreateBodyPartRequest,
  UpdateBodyPartRequest,
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
  createBodyPart,
  deleteBodyPart,
  listBodyParts,
  updateBodyPart,
  updateBodyPartEnabled,
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
const treeData = ref<BodyPartNode[]>([]);
const selectedNodeId = ref('');
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');

const form = reactive<CreateBodyPartRequest & { id?: string }>({
  enabled: true,
  parentId: '',
  partAlias: '',
  partCode: '',
  partLevel: 0,
  partName: '',
  sortOrder: 0,
});

const filteredTree = computed(() =>
  filterTreeByKeyword(treeData.value, (node) => node.partName, keyword.value),
);
const expandedKeys = computed(() => getTreeExpandedKeys(filteredTree.value));
const selectedNode = computed(() =>
  findTreeNodeById(treeData.value, selectedNodeId.value),
);

function resetForm() {
  Object.assign(form, {
    enabled: true,
    id: undefined,
    parentId: '',
    partAlias: '',
    partCode: '',
    partLevel: 0,
    partName: '',
    sortOrder: 0,
  });
}

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    treeData.value = await listBodyParts();
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

function handleTreeSelection(node?: BodyPartNode) {
  selectedNodeId.value = node?.id ?? '';
}

function openCreateDialog(parentId?: string) {
  resetForm();
  dialogMode.value = 'create';
  form.parentId = parentId ?? '';
  dialogVisible.value = true;
}

function openEditDialog(node: BodyPartNode) {
  resetForm();
  dialogMode.value = 'edit';
  Object.assign(form, {
    enabled: node.enabled,
    id: node.id,
    parentId: node.parentId ?? '',
    partAlias: node.partAlias ?? '',
    partCode: node.partCode,
    partLevel: node.partLevel,
    partName: node.partName,
    sortOrder: node.sortOrder,
  });
  dialogVisible.value = true;
}

async function submitForm() {
  dialogLoading.value = true;
  try {
    if (dialogMode.value === 'create') {
      await createBodyPart({
        enabled: form.enabled,
        parentId: form.parentId || null,
        partAlias: form.partAlias || null,
        partCode: form.partCode,
        partLevel: form.partLevel,
        partName: form.partName,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('部位节点已创建');
    } else if (form.id) {
      await updateBodyPart(form.id, {
        enabled: form.enabled,
        parentId: form.parentId || null,
        partAlias: form.partAlias || null,
        partCode: form.partCode,
        partLevel: form.partLevel,
        partName: form.partName,
        sortOrder: form.sortOrder,
      } satisfies UpdateBodyPartRequest);
      ElMessage.success('部位节点已更新');
    }
    dialogVisible.value = false;
    await loadData();
  } finally {
    dialogLoading.value = false;
  }
}

async function toggleNodeEnabled(node: BodyPartNode) {
  await updateBodyPartEnabled(node.id, !node.enabled);
  ElMessage.success('节点状态已更新');
  await loadData();
}

async function removeNode(node: BodyPartNode) {
  await deleteBodyPart(node.id);
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
    title="部位字典"
    description="维护部位层级、编码、别名、排序和启停状态。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard title="部位树" description="搜索并切换部位层级节点。">
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.BODY_PART_CREATE"
            type="primary"
            @click="openCreateDialog()"
          >
            新增根节点
          </ElButton>
        </template>
        <ElInput v-model="keyword" clearable placeholder="搜索部位名称" />
        <ElTree
          v-loading="loading"
          :current-node-key="selectedNodeId"
          :data="filteredTree"
          :default-expanded-keys="expandedKeys"
          node-key="id"
          class="mt-4"
          :props="{ children: 'children', label: 'partName' }"
          @current-change="handleTreeSelection"
          @node-click="handleTreeSelection"
        />
      </SystemSectionCard>

      <SystemSectionCard title="节点详情" description="展示当前选中节点信息，并提供子节点维护入口。">
        <template #extra>
          <ElButton
            v-if="selectedNode"
            v-access:code="M1_PERMISSION_CODES.BODY_PART_CREATE"
            @click="openCreateDialog(selectedNode.id)"
          >
            新增子节点
          </ElButton>
          <ElButton
            v-if="selectedNode"
            v-access:code="M1_PERMISSION_CODES.BODY_PART_CREATE"
            type="primary"
            @click="openEditDialog(selectedNode)"
          >
            编辑
          </ElButton>
        </template>

        <ElDescriptions v-if="selectedNode" :column="2" border>
          <ElDescriptionsItem label="部位编码">
            {{ selectedNode.partCode }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="部位名称">
            {{ selectedNode.partName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="别名">
            {{ formatNullable(selectedNode.partAlias) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="层级">
            {{ selectedNode.partLevel }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="排序">
            {{ selectedNode.sortOrder }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <SystemStatusTag :enabled="selectedNode.enabled" />
          </ElDescriptionsItem>
        </ElDescriptions>

        <div v-if="selectedNode" class="mt-4 flex flex-wrap gap-2">
          <ElButton
            v-access:code="M1_PERMISSION_CODES.BODY_PART_CREATE"
            @click="toggleNodeEnabled(selectedNode)"
          >
            {{ selectedNode.enabled ? '停用节点' : '启用节点' }}
          </ElButton>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.BODY_PART_CREATE"
            type="danger"
            @click="removeNode(selectedNode)"
          >
            删除节点
          </ElButton>
        </div>

        <ElEmpty v-else description="请先从左侧选择部位节点" />
      </SystemSectionCard>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增部位节点' : '编辑部位节点'"
      width="640px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="父节点 ID">
          <ElInput v-model="form.parentId" placeholder="根节点可留空" />
        </ElFormItem>
        <ElFormItem label="部位编码" required>
          <ElInput v-model="form.partCode" />
        </ElFormItem>
        <ElFormItem label="部位名称" required>
          <ElInput v-model="form.partName" />
        </ElFormItem>
        <ElFormItem label="部位别名">
          <ElInput v-model="form.partAlias" />
        </ElFormItem>
        <ElFormItem label="层级">
          <ElInputNumber v-model="form.partLevel" :min="0" />
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
        <ElButton :loading="dialogLoading" type="primary" @click="submitForm">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
