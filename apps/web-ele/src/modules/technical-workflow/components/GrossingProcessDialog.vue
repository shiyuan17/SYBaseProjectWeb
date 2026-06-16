<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
} from 'element-plus';

import { useGrossingProcessDialog } from '../composables/useGrossingProcessDialog';
import {
  formatCaseStatus,
  formatNullable,
  formatObjectType,
} from '../utils/format';
import GrossingSpecimenTabs from './GrossingSpecimenTabs.vue';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = defineProps<{
  modelValue: boolean;
  task: null | PendingTechnicalTaskItem;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const {
  activeSpecimenKey,
  addBlock,
  addMediaAsset,
  addSpecimen,
  beforeGrossingImageUpload,
  bodyPartTreeOptions,
  completeForm,
  createGrossingImageUploadRequest,
  currentTaskContext,
  dialogVisible,
  getSpecimenTabLabel,
  grossingImageAccept,
  isSpecimenUploading,
  labelClass,
  loadTracking,
  operatorForm,
  removeBlock,
  removeMediaAsset,
  removeSpecimen,
  resetDialogState,
  samplingTemplateTreeOptions,
  selectLoading,
  specimenTabMetas,
  submitGrossing,
  submitting,
  trackingLoading,
  trackingResult,
  workflowReferenceOptions,
} = useGrossingProcessDialog(props, emit);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="取材处理"
    width="1200px"
    @closed="resetDialogState"
  >
    <div class="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="任务号">
          {{ formatNullable(currentTaskContext.taskId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病例编号">
          {{ formatNullable(currentTaskContext.caseId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(currentTaskContext.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(currentTaskContext.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象编号" :span="2">
          {{ formatNullable(currentTaskContext.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="96px">
        <TechnicalOperatorFields
          :form="operatorForm"
          remarks-placeholder="必要时补充取材说明"
          terminal-placeholder="取材终端编码"
        />
      </ElForm>

      <div class="flex items-center justify-between">
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          优先从病例追踪带入标本，弹窗内仅保留当前处理所需的信息。
        </div>
        <ElButton
          :loading="trackingLoading || selectLoading"
          @click="loadTracking"
        >
          加载病例追踪
        </ElButton>
      </div>

      <ElDescriptions v-if="trackingResult" :column="3" border>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(trackingResult.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病例状态">
          {{ formatCaseStatus(trackingResult.caseStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="标本数">
          {{ trackingResult.specimens.length }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <GrossingSpecimenTabs
        v-model:active-specimen-key="activeSpecimenKey"
        :before-grossing-image-upload="beforeGrossingImageUpload"
        :body-part-tree-options="bodyPartTreeOptions"
        :complete-form="completeForm"
        :create-grossing-image-upload-request="createGrossingImageUploadRequest"
        :get-specimen-tab-label="getSpecimenTabLabel"
        :grossing-image-accept="grossingImageAccept"
        :is-specimen-uploading="isSpecimenUploading"
        :label-class="labelClass"
        :sampling-template-tree-options="samplingTemplateTreeOptions"
        :specimen-tab-metas="specimenTabMetas"
        :workflow-reference-options="workflowReferenceOptions"
        @add-block="addBlock"
        @add-media-asset="addMediaAsset"
        @add-specimen="addSpecimen"
        @remove-block="removeBlock"
        @remove-media-asset="removeMediaAsset"
        @remove-specimen="removeSpecimen"
      />
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitGrossing">
        完成取材
      </ElButton>
    </template>
  </ElDialog>
</template>
