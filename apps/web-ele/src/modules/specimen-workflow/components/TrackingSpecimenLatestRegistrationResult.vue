<script setup lang="ts">
import type { LatestSpecimenRegistrationResult } from '../types/specimen-workflow';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatLabelPrintStatus,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
} from '../utils/format';
import { formatContainerRatio } from '../utils/tracking-specimen-list';

defineProps<{
  result: LatestSpecimenRegistrationResult | null;
}>();
</script>

<template>
  <template v-if="result?.labelPrintBatchNo">
    <ElDescriptions :column="2" border>
      <ElDescriptionsItem label="标签批次号">
        {{ result.labelPrintBatchNo }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="打印结果">
        <ElTag :type="result.labelPrintSuccess ? 'success' : 'warning'">
          {{ result.labelPrintSuccess ? '成功' : '存在失败' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :span="2" label="结果说明">
        {{ formatNullable(result.labelPrintMessage) }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElTable :data="result.specimens" border class="mt-4">
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
          {{ formatContainerRatio(row) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标签状态" min-width="120">
        <template #default="{ row }">
          {{ formatLabelPrintStatus(row.labelPrintStatus) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="异常明细" min-width="320">
        <template #default="{ row }">
          <div class="flex flex-col gap-1 text-sm">
            <div>
              异常类型：{{
                formatReceiptStatus(row.receiptStatus ?? row.specimenStatus)
              }}
            </div>
            <div>
              质控结果：{{ formatQualityCheckResult(row.qualityCheckResult) }}
            </div>
            <div>
              问题代码：{{
                row.qualityIssueCodes?.length
                  ? row.qualityIssueCodes.join('、')
                  : '-'
              }}
            </div>
            <div>原因：{{ formatNullable(row.abnormalReason) }}</div>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>
  </template>
  <ElEmpty v-else description="暂无最近批次结果" />
</template>
