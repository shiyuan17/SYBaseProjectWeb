<script setup lang="ts">
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import { useSpecimenFixationTimePanel } from '../composables/useSpecimenFixationTimePanel';
import {
  formatDateTime,
  formatFixationStatus,
  formatNullable,
} from '../utils/format';

const {
  batchRetryResult,
  fixationLiquidType,
  getSpecimenRemovalTime,
  handleClearList,
  handleClearSelectionRows,
  handleConfirmFixation,
  handleCompleteFixationByScan,
  handleExportExcel,
  handleRetryLabel,
  handleSelectionChange,
  loading,
  pageError,
  queueItems,
  resolveFixationLiquidLabel,
  resolveFixationTagType,
  retryDialogVisible,
  retryForm,
  retrySubmitting,
  retryTargetRows,
  scanInput,
  selectedCount,
  submitRetryLabel,
  workflowReferenceOptions,
} = useSpecimenFixationTimePanel();
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

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <div class="font-semibold text-danger">设置固定时间</div>
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
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElInput
        v-model="scanInput"
        clearable
        placeholder="请输入标本号"
        style="width: 260px"
        @keyup.enter="handleCompleteFixationByScan"
      />
      <ReferenceOptionSelect
        v-model="fixationLiquidType"
        :options="workflowReferenceOptions.fixationLiquidTypes"
        placeholder="请选择固定液类型"
        style="width: 220px"
      />
      <ElButton
        :loading="loading"
        type="primary"
        @click="handleCompleteFixationByScan"
      >
        查询
      </ElButton>
      <ElButton
        :loading="loading"
        type="success"
        @click="handleConfirmFixation"
      >
        确认固定
      </ElButton>
      <ElButton @click="handleClearSelectionRows">清除选择行</ElButton>
      <ElButton @click="handleClearList">清除列表</ElButton>
      <ElButton @click="handleRetryLabel">补打标本标签</ElButton>
      <ElButton @click="handleExportExcel">导出Excel</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="queueItems"
      border
      row-key="specimenId"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="42" />
      <ElTableColumn label="序" width="60">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="申请单" min-width="130" prop="applicationNo" />
      <ElTableColumn label="标本编号" min-width="130" prop="specimenNo" />
      <ElTableColumn label="姓名" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="住院号" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.inpatientNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="80">
        <template #default="{ row }">
          {{ formatNullable(row.patientGenderLabel) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="手术间" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.surgeryName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="160" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="resolveFixationTagType(row.fixationStatus)">
            {{ formatFixationStatus(row.fixationStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="离体时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(getSpecimenRemovalTime(row.applicationId)) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.fixationTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.fixationOperatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定液类型" min-width="150">
        <template #default="{ row }">
          {{ resolveFixationLiquidLabel(row.fixationLiquidType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.queueAddedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.queueAddedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.patientIdLabel) }}
        </template>
      </ElTableColumn>
    </ElTable>
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
              <ElInput v-model="retryForm.operatorName" disabled />
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
