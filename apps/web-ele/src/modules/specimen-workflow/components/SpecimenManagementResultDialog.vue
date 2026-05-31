<script setup lang="ts">
import type { SpecimenRegisterResult } from '../types/specimen-workflow';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatLabelPrintStatus,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';

defineProps<{
  applicationId: string;
  result: null | SpecimenRegisterResult;
}>();

const emit = defineEmits<{
  (event: 'retryLatestResult'): void;
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    destroy-on-close
    title="登记结果"
    width="1100px"
  >
    <div class="flex flex-col gap-4">
      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="申请单 ID">
            {{ applicationId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标签批次号">
            {{ result?.labelPrintBatchNo || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="打印结果">
            <ElTag :type="result?.labelPrintSuccess ? 'success' : 'warning'">
              {{ result?.labelPrintSuccess ? '成功' : '存在失败' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="结果说明">
            {{ formatNullable(result?.labelPrintMessage) }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElTable :data="result?.specimens ?? []" border class="mt-4">
          <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
          <ElTableColumn label="条码" min-width="180" prop="barcode" />
          <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
          <ElTableColumn label="容器名称" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.containerName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器数/标本数" min-width="140">
            <template #default="{ row }">
              {{ `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}` }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标签状态" min-width="120">
            <template #default="{ row }">
              {{ formatLabelPrintStatus(row.labelPrintStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本状态" min-width="120">
            <template #default="{ row }">
              {{ formatSpecimenStatus(row.specimenStatus) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="visible = false">关闭</ElButton>
        <ElButton
          v-if="result?.labelPrintBatchNo && !result.labelPrintSuccess"
          type="primary"
          @click="emit('retryLatestResult')"
        >
          补打本批次
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
