<script setup lang="ts">
import { ElButton, ElInput, ElTable, ElTableColumn, ElTag } from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { useSpecimenCheckInPanel } from '../composables/useSpecimenCheckInPanel';
import {
  formatCheckInStatus,
  formatDateTime,
  formatNullable,
} from '../utils/format';
const {
  actionLoading,
  exportLoading,
  handleExport,
  handleManualCheckIn,
  handleOperatorChange,
  handleQuickCheckIn,
  handleRemoveRow,
  handleReset,
  handleRetryLabelPrint,
  handleSelectionChange,
  loading,
  operatorForm,
  pendingCount,
  queueItems,
  retryLoading,
  scanInput,
  selectedCount,
} = useSpecimenCheckInPanel();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div class="font-semibold text-[color:#d6453d]">标本入库</div>
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
        :loading="actionLoading"
        type="primary"
        @click="handleQuickCheckIn"
      >
        标本入库
      </ElButton>
      <ElButton :loading="retryLoading" @click="handleRetryLabelPrint">
        补打标本标签
      </ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton :loading="exportLoading" @click="handleExport">
        导出Excel
      </ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="queueItems"
      border
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="38" />
      <ElTableColumn label="序" type="index" width="60" />
      <ElTableColumn label="申请单" min-width="120" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="130" prop="specimenNo" />
      <ElTableColumn label="姓名" min-width="110" prop="patientName" />
      <ElTableColumn label="住院号" min-width="110">
        <template #default> - </template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="90">
        <template #default> - </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.submittingDepartmentName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="140" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="row.queueStatus === 'SUCCESS' ? 'success' : 'warning'">
            {{ formatCheckInStatus(row.checkInStatus) }}
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
      <ElTableColumn fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <ElButton
              link
              :disabled="row.queueStatus === 'SUCCESS'"
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

    <div class="text-sm text-muted-foreground">
      已入库
      {{ queueItems.filter((item) => item.queueStatus === 'SUCCESS').length }}
      条， 待处理 {{ pendingCount }} 条
    </div>
  </div>
</template>
