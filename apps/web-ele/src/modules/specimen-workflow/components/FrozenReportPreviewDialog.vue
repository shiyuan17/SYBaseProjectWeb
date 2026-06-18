<script setup lang="ts">
import type { FrozenSessionDetail } from '#/modules/frozen-workflow/types/frozen-workflow';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElTag,
} from 'element-plus';

defineProps<{
  detail: FrozenSessionDetail | null;
}>();

const visible = defineModel<boolean>({ required: true });

function formatNullable(value?: null | string): string {
  const text = (value ?? '').toString().trim();
  return text === '' ? '-' : text;
}

function formatSessionStatus(status: string | undefined): string {
  const labels: Record<string, string> = {
    CANCELLED: '已取消',
    CLOSED: '已归档',
    CONFIRMED: '报告已发布',
    DIAGNOSING: '诊断中',
    GROSSING: '取材中',
    PARAFFIN_REVIEWED: '冰石对比已完成',
    RECEIVED: '已接收',
    REPORTED: '已电话回报',
    REQUESTED: '已申请',
    SLICING: '切片中',
  };
  return labels[status ?? ''] ?? formatNullable(status);
}

function formatRemainingTissue(status: string | undefined): string {
  const labels: Record<string, string> = {
    DISPOSED: '已处理',
    PENDING: '待处理',
    RETAINED: '保留',
  };
  return labels[status ?? ''] ?? formatNullable(status);
}

function formatCompareStatus(status: null | string | undefined): string {
  if (!status) {
    return '-';
  }
  const labels: Record<string, string> = {
    MISMATCH: '不一致',
    PENDING: '待对比',
    SIGNED_OFF: '已签署',
  };
  return labels[status] ?? formatNullable(status);
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    destroy-on-close
    title="冰冻报告"
    width="720px"
  >
    <ElEmpty v-if="!detail" description="暂无冰冻报告数据" />
    <template v-else>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="申请单号">
          {{ formatNullable(detail.applicationNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病例号">
          {{ formatNullable(detail.caseId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="冰冻病理号">
          {{ formatNullable(detail.frozenPathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="患者姓名">
          {{ formatNullable(detail.patientName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请医生">
          {{ formatNullable(detail.requestDoctorName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="会话状态">
          <ElTag type="success">
            {{ formatSessionStatus(detail.sessionStatus) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="接收时间">
          {{ formatNullable(detail.receivedAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="取材完成时间">
          {{ formatNullable(detail.grossingCompletedAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="切片完成时间">
          {{ formatNullable(detail.slicingCompletedAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="电话回报时间">
          {{ formatNullable(detail.phoneBackAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="报告确认时间">
          {{ formatNullable(detail.reportConfirmedAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="快速结果">
          {{ formatNullable(detail.preliminaryResult) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="最终诊断">
          {{ formatNullable(detail.finalDiagnosis) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="剩余组织">
          {{ formatRemainingTissue(detail.remainingTissueStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="冰石对比">
          {{ formatCompareStatus(detail.compareStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="对比说明">
          {{ formatNullable(detail.compareSummary) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="交接备注">
          {{ formatNullable(detail.handoverComment) }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>
