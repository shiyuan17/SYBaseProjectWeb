<script setup lang="ts">
import type { ReceiptDraftItem } from '../utils/specimen-receipt';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  QUALITY_CHECK_RESULT_OPTIONS,
  QUALITY_ISSUE_CODE_OPTIONS,
  RECEIPT_STATUS_OPTIONS,
} from '../constants';
import { formatNullable } from '../utils/format';
import { isReceiptDraftDerivedAbnormal } from '../utils/specimen-receipt';

withDefaults(
  defineProps<{
    items: ReceiptDraftItem[];
    maxHeight?: number | string;
    showContainerName?: boolean;
    showRemoveAction?: boolean;
  }>(),
  {
    maxHeight: undefined,
    showContainerName: false,
    showRemoveAction: false,
  },
);

const emit = defineEmits<{
  remove: [key: number];
}>();
</script>

<template>
  <ElTable :data="items" row-key="key" border :max-height="maxHeight">
    <ElTableColumn label="标本条码" min-width="180">
      <template #default="{ row }">
        <ElInput
          v-model="row.specimenBarcode"
          :placeholder="showContainerName ? '标本条码' : '请输入标本条码'"
        />
      </template>
    </ElTableColumn>
    <ElTableColumn label="接收结果" min-width="140">
      <template #default="{ row }">
        <ElSelect v-model="row.receiptStatus" style="width: 100%">
          <ElOption
            v-for="option in RECEIPT_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </template>
    </ElTableColumn>
    <ElTableColumn v-if="showContainerName" label="容器名称" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.containerName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="容器数量" min-width="120">
      <template #default="{ row }">
        <ElInputNumber
          v-model="row.containerCount"
          :min="1"
          style="width: 100%"
        />
      </template>
    </ElTableColumn>
    <ElTableColumn label="质控结果" min-width="140">
      <template #default="{ row }">
        <ElSelect v-model="row.qualityCheckResult" style="width: 100%">
          <ElOption
            v-for="option in QUALITY_CHECK_RESULT_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </template>
    </ElTableColumn>
    <ElTableColumn label="问题代码" min-width="220">
      <template #default="{ row }">
        <ElSelect
          v-model="row.qualityIssueCodes"
          collapse-tags
          collapse-tags-tooltip
          filterable
          multiple
          placeholder="请选择问题代码"
          style="width: 100%"
        >
          <ElOption
            v-for="option in QUALITY_ISSUE_CODE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </template>
    </ElTableColumn>
    <ElTableColumn label="原因" min-width="180">
      <template #default="{ row }">
        <ElInput v-model="row.reason" placeholder="拒收 / 退回原因" />
      </template>
    </ElTableColumn>
    <ElTableColumn label="备注" min-width="180">
      <template #default="{ row }">
        <ElInput v-model="row.remarks" placeholder="补充说明" />
      </template>
    </ElTableColumn>
    <ElTableColumn label="处理提示" min-width="220">
      <template #default="{ row }">
        <div class="flex flex-col items-start gap-2 text-sm">
          <ElTag :type="isReceiptDraftDerivedAbnormal(row) ? 'danger' : 'success'">
            {{ isReceiptDraftDerivedAbnormal(row) ? '自动标记异常' : '正常接收' }}
          </ElTag>
          <span class="text-muted-foreground">
            {{
              isReceiptDraftDerivedAbnormal(row)
                ? '拒收、退回或质控不合格提交后会自动进入异常标记。'
                : '无需单独设置异常状态。'
            }}
          </span>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn
      v-if="showRemoveAction"
      fixed="right"
      label="操作"
      width="90"
    >
      <template #default="{ row }">
        <ElButton link type="danger" @click="emit('remove', row.key)">
          删除
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
