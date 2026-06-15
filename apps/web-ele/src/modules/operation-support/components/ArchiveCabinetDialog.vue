<script setup lang="ts">
import type { ArchiveCabinetNodeView } from '../types/operation-support';
import type { CabinetFormState } from '../utils/archive-forms';

import { computed, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTreeSelect,
} from 'element-plus';

import {
  ARCHIVE_CABINET_CREATE_TYPE_OPTIONS,
  ARCHIVE_CABINET_NODE_TYPE_OPTIONS,
} from '../constants';
import { formatArchiveCabinetNodeType } from '../utils/format';

const props = defineProps<{
  cabinetCapacityPreview: number;
  cabinetDialogMode: 'create' | 'edit' | null;
  cabinetNodes: ArchiveCabinetNodeView[];
  cabinetPositionRulePreview: string;
  isEditingCabinet: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const cabinetForm = defineModel<CabinetFormState>('cabinetForm', {
  required: true,
});

const parentNodeOptions = computed(() =>
  props.cabinetNodes
    .filter((node) => {
      if (cabinetForm.value.nodeType === 'DRAWER') {
        return node.nodeType === 'CABINET';
      }
      return node.nodeType === 'AREA';
    })
    .map((node) => ({
      label: `${node.nodeCode}（${formatArchiveCabinetNodeType(node.nodeType)}）`,
      value: node.id,
    })),
);

watch(
  () => cabinetForm.value.nodeType,
  (nodeType) => {
    if (nodeType === 'AREA') {
      cabinetForm.value.cabinetType = '';
      cabinetForm.value.capacity = 0;
      cabinetForm.value.remainingCapacity = 0;
    }
    if (nodeType === 'CABINET' && !cabinetForm.value.cabinetType) {
      cabinetForm.value.cabinetType = 'APPLICATION_FORM';
    }
    if (
      cabinetForm.value.parentId &&
      !parentNodeOptions.value.some(
        (option) => option.value === cabinetForm.value.parentId,
      )
    ) {
      cabinetForm.value.parentId = '';
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="cabinetDialogMode === 'edit' ? '更新归档柜节点' : '新增归档柜'"
    width="720px"
  >
    <ElForm class="archive-cabinet-node-form" label-width="92px">
      <ElFormItem label="父节点">
        <ElTreeSelect
          v-model="cabinetForm.parentId"
          check-strictly
          clearable
          :data="parentNodeOptions"
          :disabled="cabinetDialogMode === 'edit'"
          node-key="value"
          placeholder="ROOT"
        />
      </ElFormItem>
      <ElFormItem label="节点类型" required>
        <ElSelect
          v-model="cabinetForm.nodeType"
          :disabled="cabinetDialogMode === 'edit'"
        >
          <ElOption
            v-for="option in ARCHIVE_CABINET_NODE_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="编号" required>
        <ElInput v-model="cabinetForm.nodeCode" />
      </ElFormItem>
      <ElFormItem
        label="柜子类型"
        :required="cabinetForm.nodeType === 'CABINET'"
      >
        <ElSelect
          v-model="cabinetForm.cabinetType"
          :disabled="
            cabinetForm.nodeType !== 'CABINET' || cabinetDialogMode === 'edit'
          "
        >
          <ElOption
            v-for="option in ARCHIVE_CABINET_CREATE_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="总容量" :required="cabinetForm.nodeType !== 'AREA'">
        <ElInputNumber
          v-model="cabinetForm.capacity"
          :disabled="
            cabinetForm.nodeType === 'AREA' || cabinetDialogMode === 'edit'
          "
          :min="cabinetForm.nodeType === 'AREA' ? 0 : 1"
        />
      </ElFormItem>
      <ElFormItem label="剩余容量">
        <ElInputNumber
          v-model="cabinetForm.remainingCapacity"
          disabled
          :min="0"
        />
      </ElFormItem>
      <ElFormItem class="archive-cabinet-node-form__wide" label="路径位置">
        <ElInput v-model="cabinetForm.pathLocation" />
      </ElFormItem>
      <ElFormItem class="archive-cabinet-node-form__wide" label="备注">
        <ElInput v-model="cabinetForm.remarks" />
      </ElFormItem>
      <ElFormItem v-if="cabinetDialogMode === 'edit'" label="操作人" required>
        <ElInput v-model="cabinetForm.operatorName" />
      </ElFormItem>
      <ElFormItem v-if="cabinetDialogMode === 'edit'" label="终端编码">
        <ElInput v-model="cabinetForm.terminalCode" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
      <ElButton @click="dialogVisible = false">退出</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.archive-cabinet-node-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 20px;
}

.archive-cabinet-node-form__wide {
  grid-column: 1 / -1;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-input-number),
:deep(.el-select),
:deep(.el-tree-select) {
  width: 100%;
}

@media (max-width: 720px) {
  .archive-cabinet-node-form {
    grid-template-columns: 1fr;
  }

  .archive-cabinet-node-form__wide {
    grid-column: auto;
  }
}
</style>
