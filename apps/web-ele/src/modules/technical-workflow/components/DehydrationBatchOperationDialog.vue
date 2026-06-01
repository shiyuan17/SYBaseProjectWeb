<script setup lang="ts">
import type {
  DehydrationBatchResult,
  MediaAssetItem,
  TechnicalOperatorFormValue,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import {
  completeDehydrationBatch,
  startDehydrationBatch,
} from '../api/technical-workflow-service';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatBatchStatus } from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = withDefaults(
  defineProps<{
    initialBatchId?: string;
    modelValue: boolean;
  }>(),
  {
    initialBatchId: '',
  },
);

const emit = defineEmits<{
  submitted: [result: DehydrationBatchResult];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const submitting = ref(false);
const lastBatchResult = ref<DehydrationBatchResult | null>(null);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

function createEmptyMediaAsset(): MediaAssetItem {
  return {
    fileName: '',
    fileUrl: '',
  };
}

const batchForm = reactive({
  batchId: '',
  mediaAssets: [createEmptyMediaAsset()],
});

function resetDialogState() {
  pageError.value = '';
  lastBatchResult.value = null;
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  batchForm.batchId = props.initialBatchId;
  batchForm.mediaAssets = [createEmptyMediaAsset()];
}

function addMediaAsset() {
  batchForm.mediaAssets.push(createEmptyMediaAsset());
}

function removeMediaAsset(index: number) {
  if (batchForm.mediaAssets.length === 1) {
    ElMessage.warning('至少保留一条附件占位');
    return;
  }
  batchForm.mediaAssets.splice(index, 1);
}

async function submitStartBatch() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!batchForm.batchId.trim()) {
    ElMessage.warning('请先输入批次编号');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    lastBatchResult.value = await startDehydrationBatch(
      batchForm.batchId.trim(),
      payload,
    );
    ElMessage.success(`批次 ${lastBatchResult.value.batchNo} 已开始脱水`);
    emit('submitted', lastBatchResult.value);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

async function submitCompleteBatch() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!batchForm.batchId.trim()) {
    ElMessage.warning('请先输入批次编号');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    lastBatchResult.value = await completeDehydrationBatch(
      batchForm.batchId.trim(),
      {
        ...payload,
        mediaAssets: batchForm.mediaAssets
          .filter((item) => item.fileUrl.trim())
          .map((item) => ({
            fileName: (item.fileName ?? '').trim() || null,
            fileUrl: item.fileUrl.trim(),
          })),
      },
    );
    ElMessage.success(`批次 ${lastBatchResult.value.batchNo} 已完成脱水`);
    emit('submitted', lastBatchResult.value);
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [props.modelValue, props.initialBatchId],
  ([visible]) => {
    if (visible) {
      resetDialogState();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="批次开始与完成"
    width="880px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          terminal-placeholder="脱水终端编码"
        />
        <ElFormItem label="批次编号" required>
          <ElInput v-model="batchForm.batchId" placeholder="请输入批次编号" />
        </ElFormItem>

        <div class="mb-2 mt-4 flex items-center justify-between">
          <h4 class="text-sm font-medium text-foreground">附件占位</h4>
          <ElButton link type="primary" @click="addMediaAsset">
            新增附件
          </ElButton>
        </div>
        <div class="flex flex-col gap-3">
          <section
            v-for="(asset, assetIndex) in batchForm.mediaAssets"
            :key="assetIndex"
            class="rounded border border-border p-3"
          >
            <div class="mb-3 flex justify-end">
              <ElButton
                link
                type="danger"
                @click="removeMediaAsset(assetIndex)"
              >
                删除附件
              </ElButton>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <ElInput v-model="asset.fileUrl" placeholder="附件地址" />
              <ElInput v-model="asset.fileName" placeholder="附件名称" />
            </div>
          </section>
        </div>
      </ElForm>

      <ElAlert
        v-if="lastBatchResult"
        :closable="false"
        :title="`当前批次：${lastBatchResult.batchNo}（${formatBatchStatus(lastBatchResult.batchStatus)}）`"
        type="success"
        show-icon
      />
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitStartBatch">
        开始脱水
      </ElButton>
      <ElButton
        :loading="submitting"
        type="success"
        @click="submitCompleteBatch"
      >
        完成脱水
      </ElButton>
    </template>
  </ElDialog>
</template>
