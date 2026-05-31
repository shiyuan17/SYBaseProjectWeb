<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatDateTime,
  formatFixationStatus,
  formatLabelPrintStatus,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';
import {
  canCompleteVerify,
  canRetryBatch,
  canStartVerify,
  labelTagType,
  specimenTagType,
} from '../utils/specimen-management';

defineProps<{
  canVerifyFixation: boolean;
  items: SpecimenManagementListItem[];
  listLoading: boolean;
}>();

const emit = defineEmits<{
  (event: 'detail', row: SpecimenManagementListItem): void;
  (event: 'goToTracking', row: SpecimenManagementListItem): void;
  (event: 'rowRetry', row: SpecimenManagementListItem): void;
  (event: 'selectionChange', rows: SpecimenManagementListItem[]): void;
  (
    event: 'verify',
    row: SpecimenManagementListItem,
    action: 'complete' | 'start',
  ): void;
}>();

function formatContainerRatio(row: SpecimenManagementListItem) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}
</script>

<template>
  <ElTable
    v-loading="listLoading"
    :data="items"
    border
    row-key="specimenId"
    @selection-change="emit('selectionChange', $event)"
  >
    <ElTableColumn type="selection" width="48" />
    <ElTableColumn label="鏍囨湰缂栧彿" min-width="150" prop="specimenNo" />
    <ElTableColumn
      label="鍏宠仈鐢宠鍗?"
      min-width="160"
      prop="applicationNo"
    />
    <ElTableColumn label="鎮ｈ€呭鍚?" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.patientName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="閫佹绉戝" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.submittingDepartmentName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="鏍囨湰鍚嶇О" min-width="180" prop="specimenName" />
    <ElTableColumn label="瀹瑰櫒鍚嶇О" min-width="150">
      <template #default="{ row }">
        {{ formatNullable(row.containerName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="瀹瑰櫒鏁?鏍囨湰鏁?" min-width="140">
      <template #default="{ row }">
        {{ formatContainerRatio(row) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="閲囬泦閮ㄤ綅" min-width="150">
      <template #default="{ row }">
        {{ formatNullable(row.specimenSite) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="鐧昏鏃堕棿" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.registeredAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="鏍囩鎵撳嵃鐘舵€?" min-width="160">
      <template #default="{ row }">
        <div class="flex flex-col items-start gap-2">
          <ElTag :type="labelTagType(row.labelPrintStatus)">
            {{ formatLabelPrintStatus(row.labelPrintStatus) }}
          </ElTag>
          <ElButton
            v-if="canRetryBatch(row)"
            link
            type="primary"
            @click="emit('rowRetry', row)"
          >
            琛ユ墦鏍囩
          </ElButton>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="鏍囨湰鐘舵€?" min-width="160">
      <template #default="{ row }">
        <div class="flex flex-col items-start gap-2">
          <ElTag :type="specimenTagType(row)">
            {{ formatSpecimenStatus(row.specimenStatus) }}
          </ElTag>
          <span class="text-xs text-muted-foreground">
            {{ formatFixationStatus(row.fixationStatus) }}
          </span>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="寮傚父鏍囪" min-width="130">
      <template #default="{ row }">
        <ElTag :type="row.abnormalFlag ? 'danger' : 'info'">
          {{ row.abnormalFlag ? '寮傚父' : '姝ｅ父' }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="鏈€杩戞祦杞?" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.latestTrackingAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn fixed="right" label="鎿嶄綔" width="220">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-x-3 gap-y-1">
          <ElButton
            v-if="row.abnormalFlag"
            link
            type="danger"
            @click="emit('goToTracking', row)"
          >
            寮傚父澶勭悊
          </ElButton>
          <ElButton
            v-else-if="canRetryBatch(row)"
            link
            type="primary"
            @click="emit('rowRetry', row)"
          >
            琛ユ墦鏍囩
          </ElButton>
          <ElButton
            v-else-if="canVerifyFixation && canStartVerify(row)"
            link
            type="primary"
            @click="emit('verify', row, 'start')"
          >
            寮€濮嬫牳楠?
          </ElButton>
          <ElButton
            v-else-if="canVerifyFixation && canCompleteVerify(row)"
            link
            type="success"
            @click="emit('verify', row, 'complete')"
          >
            瀹屾垚鏍搁獙
          </ElButton>
          <ElButton link type="primary" @click="emit('detail', row)">
            璇︽儏
          </ElButton>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
