<script setup lang="ts">
import type { SpecimenReceiptResult } from '../types/specimen-workflow';

import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus';

import { formatNullable } from '../utils/format';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  result: SpecimenReceiptResult;
}>();
</script>

<template>
  <WorkflowSectionCard
    title="接收结果"
    description="展示接收后的病例号、病理号、整体签收状态、未签收数量与异常摘要。"
  >
    <ElDescriptions :column="2" border>
      <ElDescriptionsItem label="病例编号">
        {{ formatNullable(result.caseId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="病理号">
        {{ formatNullable(result.pathologyNo) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="接收状态">
        {{ result.receiptStatus }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="未接收数量">
        {{ result.unreceivedCount }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="提醒计数">
        {{ result.reminderCount ?? 0 }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="异常批次">
        <ElTag :type="result.batchAbnormalFlag ? 'danger' : 'success'">
          {{ result.batchAbnormalFlag ? '是' : '否' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem :span="2" label="异常摘要">
        {{ formatNullable(result.receiptAbnormalSummary) }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </WorkflowSectionCard>
</template>
