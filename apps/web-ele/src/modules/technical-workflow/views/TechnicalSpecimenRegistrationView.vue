<script setup lang="ts">
import type {
  PendingTechnicalSpecimenRegistrationItem,
  SaveTechnicalSpecimenRegistrationMaterialItem,
  TechnicalSpecimenRegistrationWorkspace,
} from '../types/technical-workflow';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  completeTechnicalSpecimenRegistration,
  deleteTechnicalSpecimenRegistrationMediaAsset,
  getTechnicalSpecimenRegistrationWorkspace,
  listPendingTechnicalSpecimenRegistrations,
  saveTechnicalSpecimenRegistrationMaterials,
  uploadTechnicalSpecimenRegistrationMediaAsset,
} from '../api/technical-workflow-service';
import TechnicalSpecimenRegistrationMediaPanel from '../components/specimen-registration/TechnicalSpecimenRegistrationMediaPanel.vue';
import TechnicalSpecimenRegistrationPendingListPanel from '../components/specimen-registration/TechnicalSpecimenRegistrationPendingListPanel.vue';
import TechnicalSpecimenRegistrationWorkspacePanel from '../components/specimen-registration/TechnicalSpecimenRegistrationWorkspacePanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const pendingLoading = ref(false);
const workspaceLoading = ref(false);
const materialSaving = ref(false);
const mediaUploading = ref(false);
const mediaDeleting = ref(false);
const submitting = ref(false);
const pageError = ref('');
const workspaceError = ref('');
const pendingItems = ref<PendingTechnicalSpecimenRegistrationItem[]>([]);
const total = ref(0);
const selectedCaseId = ref('');
const workspace = ref<null | TechnicalSpecimenRegistrationWorkspace>(null);
const completionRemarks = ref('');
const activeMediaAssetId = ref('');

const filters = reactive({
  keyword: '',
  page: 1,
  receivedFrom: '',
  receivedTo: '',
  size: DEFAULT_PAGE_SIZE,
});

const currentPageModel = computed({
  get: () => filters.page,
  set: (page: number) => {
    filters.page = page;
    void loadPendingData(selectedCaseId.value);
  },
});

const pageSizeModel = computed({
  get: () => filters.size,
  set: (size: number) => {
    filters.size = size;
    filters.page = 1;
    void loadPendingData(selectedCaseId.value);
  },
});

function syncWorkspace(nextWorkspace: null | TechnicalSpecimenRegistrationWorkspace) {
  workspace.value = nextWorkspace;
  const nextActiveAssetId =
    nextWorkspace?.mediaAssets.some((item) => item.assetId === activeMediaAssetId.value)
      ? activeMediaAssetId.value
      : nextWorkspace?.mediaAssets[0]?.assetId ?? '';
  activeMediaAssetId.value = nextActiveAssetId;
}

async function loadPendingData(preferredCaseId?: string) {
  pendingLoading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalSpecimenRegistrations({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      receivedFrom: filters.receivedFrom || undefined,
      receivedTo: filters.receivedTo || undefined,
      size: filters.size,
    });
    pendingItems.value = result.items;
    total.value = result.total;

    const nextSelectedCaseId =
      preferredCaseId &&
      result.items.some((item) => item.caseId === preferredCaseId)
        ? preferredCaseId
        : result.items[0]?.caseId ?? '';
    selectedCaseId.value = nextSelectedCaseId;
    completionRemarks.value = '';

    if (nextSelectedCaseId) {
      await loadWorkspace(nextSelectedCaseId);
    } else {
      syncWorkspace(null);
      workspaceError.value = '';
    }
  } catch (error) {
    pendingItems.value = [];
    total.value = 0;
    syncWorkspace(null);
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    pendingLoading.value = false;
  }
}

async function loadWorkspace(caseId: string) {
  if (!caseId.trim()) {
    syncWorkspace(null);
    return;
  }
  workspaceLoading.value = true;
  workspaceError.value = '';
  try {
    const result = await getTechnicalSpecimenRegistrationWorkspace(caseId);
    syncWorkspace(result);
  } catch (error) {
    syncWorkspace(null);
    workspaceError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    workspaceLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData(selectedCaseId.value);
}

function handleRowSelect(row: PendingTechnicalSpecimenRegistrationItem) {
  if (row.caseId === selectedCaseId.value) {
    return;
  }
  selectedCaseId.value = row.caseId;
  completionRemarks.value = '';
  void loadWorkspace(row.caseId);
}

async function handleSaveMaterials(
  materials: SaveTechnicalSpecimenRegistrationMaterialItem[],
) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  materialSaving.value = true;
  try {
    const result = await saveTechnicalSpecimenRegistrationMaterials(currentCaseId, {
      materials,
      terminalCode: 'T-M3-SPEC-REG',
    });
    syncWorkspace(result);
    ElMessage.success('材料修改已保存');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    materialSaving.value = false;
  }
}

async function handleUploadMediaAsset(file: File) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  mediaUploading.value = true;
  try {
    await uploadTechnicalSpecimenRegistrationMediaAsset(currentCaseId, file);
    await loadWorkspace(currentCaseId);
    ElMessage.success('图片已导入');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    mediaUploading.value = false;
  }
}

async function handleDeleteMediaAsset(assetId: string) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  mediaDeleting.value = true;
  try {
    await deleteTechnicalSpecimenRegistrationMediaAsset(currentCaseId, assetId);
    await loadWorkspace(currentCaseId);
    ElMessage.success('图片已删除');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    mediaDeleting.value = false;
  }
}

async function handleCompleteRegistration() {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  submitting.value = true;
  try {
    const result = await completeTechnicalSpecimenRegistration(currentCaseId, {
      remarks: completionRemarks.value.trim() || undefined,
      terminalCode: 'T-M3-SPEC-REG',
    });
    ElMessage.success('标本登记完成，已进入取材前置队列');
    await loadPendingData();
    await navigation.goToTasks({
      mode: 'queue',
      pathologyNo: result.pathologyNo ?? undefined,
    });
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void loadPendingData();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <div class="grid gap-4 2xl:grid-cols-[360px_minmax(0,1.55fr)_minmax(320px,0.9fr)] xl:grid-cols-[320px_minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <TechnicalSpecimenRegistrationPendingListPanel
          v-model:keyword="filters.keyword"
          v-model:page="currentPageModel"
          v-model:received-from="filters.receivedFrom"
          v-model:received-to="filters.receivedTo"
          v-model:size="pageSizeModel"
          :items="pendingItems"
          :loading="pendingLoading"
          :selected-case-id="selectedCaseId"
          :total="total"
          @search="handleSearch"
          @select="handleRowSelect"
        />

        <TechnicalSpecimenRegistrationWorkspacePanel
          v-model:completion-remarks="completionRemarks"
          :loading="workspaceLoading"
          :material-saving="materialSaving"
          :submitting="submitting"
          :workspace="workspace"
          @complete="handleCompleteRegistration"
          @save-materials="handleSaveMaterials"
        />

        <TechnicalSpecimenRegistrationMediaPanel
          :active-asset-id="activeMediaAssetId"
          :can-delete="workspace?.actionFlags.canDeleteMediaAssets ?? false"
          :can-upload="workspace?.actionFlags.canUploadMediaAssets ?? false"
          :deleting="mediaDeleting"
          :media-assets="workspace?.mediaAssets ?? []"
          :uploading="mediaUploading"
          @delete="handleDeleteMediaAsset"
          @select="activeMediaAssetId = $event"
          @upload="handleUploadMediaAsset"
        />
      </div>

      <p class="text-xs text-slate-500">
        当前保留阶段动作：保存材料修改、导入图片、删除图片、完成登记；病理检查号仅展示接收阶段已生成编号。
      </p>
    </div>
  </Page>
</template>
