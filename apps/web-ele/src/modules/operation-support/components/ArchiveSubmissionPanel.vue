<script setup lang="ts">
import type { ArchiveFormState } from '../utils/archive-forms';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { ARCHIVE_OBJECT_TYPE_OPTIONS } from '../constants';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  archivePermissionWarning: string;
  archiveSubmitButtonText: string;
  canSubmitArchive: boolean;
  selectedPositionLabel: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitArchive'): void;
}>();

const archiveForm = defineModel<ArchiveFormState>('archiveForm', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    title="统一归档操作"
    description="申请单图片仅使用 fileUrl，不执行真实上传。归档时直接复用上方所选可用柜位。"
  >
    <ElAlert
      v-if="archivePermissionWarning"
      :closable="false"
      class="mb-4"
      :title="archivePermissionWarning"
      type="warning"
    />

    <ElForm label-width="110px">
      <ElFormItem label="对象类型" required>
        <ElSelect v-model="archiveForm.objectType" style="width: 220px">
          <ElOption
            v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标柜位" required>
        <div class="flex flex-col gap-2">
          <div class="text-sm font-medium">{{ selectedPositionLabel }}</div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            归档会直接使用上方“柜位查询与选择”中当前选中的可用柜位。
          </div>
        </div>
      </ElFormItem>
      <ElFormItem
        v-if="archiveForm.objectType === 'APPLICATION_FORM'"
        label="病例 ID"
        required
      >
        <ElInput
          v-model="archiveForm.caseId"
          placeholder="请输入病例 ID"
          style="width: 320px"
        />
      </ElFormItem>
      <ElFormItem
        v-if="archiveForm.objectType === 'APPLICATION_FORM'"
        label="图片 URL"
      >
        <ElInput
          v-model="archiveForm.fileUrl"
          placeholder="请输入申请单图片 fileUrl"
          style="width: 520px"
        />
      </ElFormItem>
      <ElFormItem
        v-if="archiveForm.objectType === 'APPLICATION_FORM'"
        label="文件名"
      >
        <ElInput
          v-model="archiveForm.fileName"
          placeholder="可选，便于后续识别"
          style="width: 320px"
        />
      </ElFormItem>
      <ElFormItem
        v-if="archiveForm.objectType === 'EMBEDDING_BOX'"
        label="蜡块 ID"
        required
      >
        <ElInput
          v-model="archiveForm.embeddingBoxId"
          placeholder="请输入蜡块 ID"
          style="width: 320px"
        />
      </ElFormItem>
      <ElFormItem
        v-if="archiveForm.objectType === 'SLIDE'"
        label="玻片 ID"
        required
      >
        <ElInput
          v-model="archiveForm.slideId"
          placeholder="请输入玻片 ID"
          style="width: 320px"
        />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="archiveForm.operatorName" style="width: 220px" />
      </ElFormItem>
      <ElFormItem label="终端编码">
        <ElInput v-model="archiveForm.terminalCode" style="width: 220px" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="archiveForm.remarks" type="textarea" />
      </ElFormItem>
      <ElFormItem>
        <ElButton
          :disabled="!canSubmitArchive"
          :loading="submitting"
          type="primary"
          @click="emit('submitArchive')"
        >
          {{ archiveSubmitButtonText }}
        </ElButton>
      </ElFormItem>
    </ElForm>
  </OperationSectionCard>
</template>
