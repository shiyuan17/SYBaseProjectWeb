<script setup lang="ts">
import {
  ElButton,
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { useSpecimenCheckInPanel } from '../composables/useSpecimenCheckInPanel';
import { formatDateTime, formatNullable } from '../utils/format';
import {
  resolveCheckInWorkflowRowTone,
  resolveSpecimenWorkflowRowClassName,
} from '../utils/specimen-workflow-row-tone';

import '../styles/specimen-workflow-row-tone.css';

const {
  actionLoading,
  clearQueue,
  exportLoading,
  formatSpecimenStatus,
  handleExport,
  handleManualCheckIn,
  handleOperatorChange,
  handlePageChange,
  handlePageSizeChange,
  handlePrimaryCheckIn,
  handleQuickCheckIn,
  handleRemoveRow,
  handleReset,
  handleRetryLabelPrint,
  handleSelectionChange,
  loading,
  operatorForm,
  pagedItems,
  pagination,
  pendingCount,
  queueItems,
  retryLoading,
  scanInput,
  selectedCount,
  total,
} = useSpecimenCheckInPanel();

function resolveRowClassName({
  row,
}: {
  row: (typeof queueItems.value)[number];
}) {
  return resolveSpecimenWorkflowRowClassName(
    resolveCheckInWorkflowRowTone(row),
  );
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div>
        全部
        <span class="text-xl font-semibold text-primary">{{
          queueItems.length
        }}</span>
      </div>
      <div>
        已选
        <span class="text-xl font-semibold text-success">{{
          selectedCount
        }}</span>
      </div>
      <div>
        待处理
        <span class="text-xl font-semibold text-danger">{{
          pendingCount
        }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElInput
        v-model="scanInput"
        clearable
        placeholder="标本id / 流水号 / 条码"
        style="width: 260px"
        @keyup.enter="handleQuickCheckIn"
      />
      <div class="w-[180px]">
        <SystemUserSelect
          v-model="operatorForm.operatorUserId"
          :selected-label="operatorForm.operatorName"
          placeholder="选择入库人"
          @change="handleOperatorChange"
        />
      </div>
      <ElButton
        :loading="actionLoading || retryLoading"
        type="primary"
        @click="handlePrimaryCheckIn"
      >
        标本入库
      </ElButton>
      <ElButton :loading="retryLoading" @click="handleRetryLabelPrint">
        补打标本标签
      </ElButton>
      <ElButton @click="clearQueue">清除列表</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton :loading="exportLoading" @click="handleExport">
        导出Excel
      </ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="pagedItems"
      :row-class-name="resolveRowClassName"
      border
      max-height="520"
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="38" />
      <ElTableColumn label="序" width="60">
        <template #default="{ $index }">
          {{ (pagination.page - 1) * pagination.size + $index + 1 }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="申请单" min-width="120" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="130" prop="specimenNo" />
      <ElTableColumn label="姓名" min-width="110" prop="patientName" />
      <ElTableColumn label="住院号" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.inpatientNoLabel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病区" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.wardName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="90">
        <template #default="{ row }">
          {{ formatNullable(row.patientGenderLabel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.surgeryName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="140" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          {{ formatSpecimenStatus(row.specimenStatus) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="row.checkInStatusTagType">
            {{ row.displayCheckInStatus }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.checkedInAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.checkedInByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.queueAddedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120" prop="queueAddedByName" />
      <ElTableColumn label="病人ID" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.patientIdLabel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <ElButton
              link
              :disabled="row.queueStatus === 'SUCCESS' || !row.canCheckIn"
              :title="row.canCheckIn ? '' : row.checkInDisabledReason || ''"
              type="primary"
              @click="handleManualCheckIn(row)"
            >
              入库
            </ElButton>
            <ElButton link type="danger" @click="handleRemoveRow(row)">
              移除
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-muted-foreground">
        已入库
        {{ queueItems.filter((item) => item.queueStatus === 'SUCCESS').length }}
        条，待处理 {{ pendingCount }} 条
      </div>
      <ElPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>
