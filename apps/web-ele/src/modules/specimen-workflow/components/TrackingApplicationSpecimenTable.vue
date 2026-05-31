<script setup lang="ts">
import type { SpecimenTrackingSummary } from '../types/specimen-workflow';

import { ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatFixationStatus,
  formatLabelPrintStatus,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
  formatSpecimenStatus,
} from '../utils/format';

defineProps<{
  specimens: SpecimenTrackingSummary[];
}>();
</script>

<template>
  <ElTable :data="specimens" border>
    <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
    <ElTableColumn label="条码" min-width="180" prop="barcode" />
    <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
    <ElTableColumn label="标本类型" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.specimenType) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本部位" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.specimenSite) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="流程状态" min-width="140">
      <template #default="{ row }">
        <ElTag :type="row.specimenStatus === 'RECEIVED' ? 'success' : 'info'">
          {{ formatSpecimenStatus(row.specimenStatus) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="固定状态" min-width="140">
      <template #default="{ row }">
        {{ formatFixationStatus(row.fixationStatus) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标签状态" min-width="140">
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
