<script setup lang="ts">
import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { useSpecimenBarcodeBindingPanel } from '../composables/useSpecimenBarcodeBindingPanel';
import { formatDateTime, formatNullable } from '../utils/format';

const {
  actionLoading,
  batchRetryResult,
  buildingOptions,
  canBind,
  canExportExcel,
  canPreprint,
  canRetryLabel,
  canUnbind,
  filters,
  handleBindBarcode,
  handleExportExcel,
  handlePreprintBarcodes,
  handleReset,
  handleRetryLabel,
  handleSearch,
  handleSelectionChange,
  handleUnbindBarcode,
  loading,
  pageError,
  pagedItems,
  resolveRoomLabel,
  retryDialogVisible,
  retryForm,
  retrySubmitting,
  retryTargetRows,
  roomOptions,
  submitRetryLabel,
  summary,
  targetBarcode,
  total,
} = useSpecimenBarcodeBindingPanel();
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElAlert
      v-if="pageError"
      :closable="false"
      :title="pageError"
      type="error"
      show-icon
    />

    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div class="font-semibold text-danger">条码绑定</div>
      <div>
        全部
        <span class="text-xl font-semibold text-primary">{{
          summary.totalCount
        }}</span>
      </div>
      <div>
        未绑定
        <span class="text-xl font-semibold text-danger">{{
          summary.unboundCount
        }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElSelect
        v-model="filters.buildingId"
        clearable
        placeholder="手术楼"
        style="width: 160px"
      >
        <ElOption
          v-for="building in buildingOptions"
          :key="building.buildingId"
          :label="building.buildingName"
          :value="building.buildingId"
        />
      </ElSelect>
      <ElSelect
        v-model="filters.roomId"
        clearable
        placeholder="手术间"
        style="width: 220px"
      >
        <ElOption
          v-for="room in roomOptions"
          :key="room.roomId"
          :label="resolveRoomLabel(room)"
          :value="room.roomId"
        />
      </ElSelect>
      <ElCheckbox v-model="filters.onlyUnbound">仅显示未绑定</ElCheckbox>
      <ElDatePicker
        v-model="filters.dateRange"
        end-placeholder="结束日期"
        start-placeholder="开始日期"
        style="width: 280px"
        type="daterange"
        value-format="YYYY-MM-DD"
      />
      <ElButton :loading="loading" type="primary" @click="handleSearch">
        查询
      </ElButton>
      <ElInput
        v-model="targetBarcode"
        clearable
        placeholder="请输入目标条码"
        style="width: 220px"
      />
      <ElButton
        :disabled="!canBind"
        :loading="actionLoading"
        type="success"
        @click="handleBindBarcode"
      >
        条码绑定
      </ElButton>
      <ElButton
        :disabled="!canUnbind"
        :loading="actionLoading"
        @click="handleUnbindBarcode"
      >
        取消绑定
      </ElButton>
      <ElButton :disabled="!canRetryLabel" @click="handleRetryLabel">
        补打标本标签
      </ElButton>
      <ElButton :disabled="!canExportExcel" @click="handleExportExcel">
        导出 Excel
      </ElButton>
      <ElButton :disabled="!canPreprint" @click="handlePreprintBarcodes">
        预打印条码
      </ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="pagedItems"
      border
      max-height="520"
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="52" />
      <ElTableColumn label="序" width="64">
        <template #default="{ $index }">
          {{ (filters.page - 1) * filters.size + $index + 1 }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="申请单" min-width="120" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="120" prop="specimenNo" />
      <ElTableColumn label="性别" min-width="80">
        <template #default="{ row }">
          {{ formatNullable(row.patientGender) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.surgeryName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
      <ElTableColumn label="标本条码" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.barcode) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.registeredAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.registrationOperatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.patientId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="姓名" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-end">
      <ElPagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
      />
    </div>
  </div>

  <ElDialog
    v-model="retryDialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="补打标本标签"
    width="760px"
  >
    <div class="flex flex-col gap-4">
      <section
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <div class="mb-4 text-base font-semibold text-foreground">补打范围</div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>涉及标本数：{{ retryTargetRows.length }}</div>
          <div>
            标签批次号：{{ retryTargetRows[0]?.labelPrintBatchNo || '-' }}
          </div>
        </div>
      </section>

      <section
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="操作人" required>
              <ElInput :model-value="retryForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编号" required>
              <ElInput
                v-model="retryForm.printerCode"
                placeholder="请输入打印机编号"
              />
            </ElFormItem>
            <ElFormItem label="终端编号">
              <ElInput v-model="retryForm.terminalCode" placeholder="可选" />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
          </ElFormItem>
        </ElForm>
      </section>

      <section
        v-if="batchRetryResult"
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <div class="mb-4 text-base font-semibold text-foreground">补打结果</div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>批次号：{{ batchRetryResult.labelPrintBatchNo }}</div>
          <div>
            结果：{{ batchRetryResult.allSuccessful ? '全部成功' : '部分成功' }}
          </div>
          <div>成功数：{{ batchRetryResult.successCount }}</div>
          <div>失败数：{{ batchRetryResult.failedCount }}</div>
          <div>重试数：{{ batchRetryResult.retriedCount }}</div>
          <div>消息：{{ formatNullable(batchRetryResult.message) }}</div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="retryDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="retrySubmitting"
          type="primary"
          @click="submitRetryLabel"
        >
          提交补打
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
