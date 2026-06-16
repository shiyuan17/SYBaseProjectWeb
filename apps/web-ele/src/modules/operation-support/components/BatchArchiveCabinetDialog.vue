<script setup lang="ts">
import type { ArchiveCabinetNodeView } from '../types/operation-support';
import type { BatchCabinetFormState } from '../utils/archive-forms';

import { computed } from 'vue';

import {
  ElAlert,
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

import { ARCHIVE_CABINET_CREATE_TYPE_OPTIONS } from '../constants';

const props = defineProps<{
  cabinetNodes: ArchiveCabinetNodeView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const batchCabinetForm = defineModel<BatchCabinetFormState>(
  'batchCabinetForm',
  {
    required: true,
  },
);

const parentNodeOptions = computed(() =>
  props.cabinetNodes
    .filter((node) => node.nodeType === 'AREA')
    .map((node) => ({
      label: node.nodeCode,
      value: node.id,
    })),
);
</script>

<template>
  <ElDialog v-model="dialogVisible" title="批量添加归档柜" width="720px">
    <ElForm label-width="118px">
      <ElFormItem label="父节点">
        <ElTreeSelect
          v-model="batchCabinetForm.parentId"
          check-strictly
          clearable
          :data="parentNodeOptions"
          node-key="value"
          placeholder="ROOT"
        />
      </ElFormItem>
      <ElFormItem label="柜子类型" required>
        <ElSelect v-model="batchCabinetForm.cabinetType">
          <ElOption
            v-for="option in ARCHIVE_CABINET_CREATE_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="编号前缀" required>
        <ElInput v-model="batchCabinetForm.cabinetCodePrefix" />
      </ElFormItem>
      <ElFormItem label="名称前缀">
        <ElInput v-model="batchCabinetForm.cabinetNamePrefix" />
      </ElFormItem>
      <ElFormItem label="起始序号" required>
        <ElInputNumber v-model="batchCabinetForm.startNo" :min="0" />
      </ElFormItem>
      <ElFormItem label="添加数量" required>
        <ElInputNumber v-model="batchCabinetForm.count" :max="100" :min="1" />
      </ElFormItem>
      <ElFormItem label="序号位数" required>
        <ElInputNumber
          v-model="batchCabinetForm.numberWidth"
          :max="10"
          :min="1"
        />
      </ElFormItem>
      <ElFormItem label="层数" required>
        <ElInputNumber v-model="batchCabinetForm.layerCount" :min="1" />
      </ElFormItem>
      <ElFormItem label="每层柜位数" required>
        <ElInputNumber v-model="batchCabinetForm.slotCountPerLayer" :min="1" />
      </ElFormItem>
      <ElFormItem label="路径位置">
        <ElInput v-model="batchCabinetForm.locationDescription" />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="batchCabinetForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="终端编码">
        <ElInput v-model="batchCabinetForm.terminalCode" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="batchCabinetForm.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>

    <ElAlert :closable="false" class="mt-4" type="info">
      <template #title>
        编号示例：{{ batchCabinetForm.cabinetCodePrefix
        }}{{
          String(batchCabinetForm.startNo).padStart(
            batchCabinetForm.numberWidth,
            '0',
          )
        }}
      </template>
      <template #default>
        批量添加会在后端事务内完成；若任一柜号重复，整批不会创建。
      </template>
    </ElAlert>

    <template #footer>
      <ElButton @click="dialogVisible = false">退出</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
