<script setup lang="ts">
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { useSpecimenConfirmationPanel } from '../composables/useSpecimenConfirmationPanel';
import { formatDateTime, formatNullable } from '../utils/format';
import {
  resolveConfirmationWorkflowRowTone,
  resolveSpecimenWorkflowRowClassName,
} from '../utils/specimen-workflow-row-tone';

import '../styles/specimen-workflow-row-tone.css';

const {
  actionLoading,
  batchRetryResult,
  canConfirm,
  filters,
  handleConfirmRow,
  handleConfirmSelected,
  handleClearList,
  handleClearSelectionRows,
  handleExportExcel,
  handleOperatorChange,
  handleReset,
  handleRetryLabel,
  handleSearch,
  handleSelectionChange,
  loading,
  operatorForm,
  pageError,
  pagedItems,
  isConfirmationUnsaved,
  retryDialogVisible,
  retryForm,
  retrySubmitting,
  retryTargetRows,
  resolveConfirmationStatus,
  submitRetryLabel,
  summary,
  total,
  tryQuickConfirmByKeyword,
} = useSpecimenConfirmationPanel();

function resolveRowClassName({
  row,
}: {
  row: (typeof pagedItems.value)[number];
}) {
  return resolveSpecimenWorkflowRowClassName(
    resolveConfirmationWorkflowRowTone(row, {
      canConfirm: canConfirm(row),
      isDraft: isConfirmationUnsaved(row),
    }),
  );
}
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
      <div class="font-semibold text-danger">标本确认</div>
      <div>
        全部
        <span class="text-xl font-semibold text-primary">{{
          summary.allCount
        }}</span>
      </div>
      <div>
        标本确认
        <span class="text-xl font-semibold text-success">{{
          summary.confirmedCount
        }}</span>
      </div>
      <div>
        未确认
        <span class="text-xl font-semibold text-danger">{{
          summary.pendingCount
        }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElInput
        v-model="filters.keyword"
        clearable
        placeholder="申请单号 / 标本编号 / 条码"
        style="width: 300px"
        @keyup.enter="tryQuickConfirmByKeyword"
      />
      <div class="w-[220px]">
        <SystemUserSelect
          v-model="operatorForm.operatorUserId"
          :selected-label="operatorForm.operatorName"
          placeholder="选择确认人"
          @change="handleOperatorChange"
        />
      </div>
      <ElButton :loading="loading" type="primary" @click="handleSearch">
        查询
      </ElButton>
      <ElButton
        :loading="actionLoading"
        type="success"
        @click="handleConfirmSelected"
      >
        标本确认
      </ElButton>
      <ElButton @click="handleClearSelectionRows">清除选择行</ElButton>
      <ElButton @click="handleClearList">清除列表</ElButton>
      <ElButton @click="handleRetryLabel">补打标本标签</ElButton>
      <ElButton @click="handleExportExcel">导出Excel</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="pagedItems"
      :row-class-name="resolveRowClassName"
      border
      max-height="520"
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
      <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
      <ElTableColumn label="标本状态" min-width="120">
        <template #default="{ row }">
          <ElTag
            :type="
              row.specimenConfirmedAt
                ? 'success'
                : resolveConfirmationStatus(row) === '确认未保存'
                  ? 'warning'
                  : 'danger'
            "
          >
            {{ resolveConfirmationStatus(row) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.specimenType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="确认时间" min-width="140">
        <template #default="{ row }">
          {{ formatDateTime(row.specimenConfirmedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="确认人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.specimenConfirmedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加时间" min-width="140">
        <template #default="{ row }">
          {{ formatDateTime(row.registrationTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="添加人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.registrationOperatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" width="110">
        <template #default="{ row }">
          <ElButton
            link
            :disabled="!canConfirm(row)"
            :title="row.actionDisabledReason ?? ''"
            type="primary"
            @click="handleConfirmRow(row)"
          >
            标本确认
          </ElButton>
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
