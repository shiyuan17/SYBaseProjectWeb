<script setup lang="ts">
import type { ReceiptWorkbenchRow } from '../utils/specimen-receipt-workbench';

import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

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

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import SpecimenReceiptDirectDrawer from '../components/SpecimenReceiptDirectDrawer.vue';
import SpecimenReceiptReceiveDialog from '../components/SpecimenReceiptReceiveDialog.vue';
import { useSpecimenReceiptWorkbench } from '../composables/useSpecimenReceiptWorkbench';
import { formatDateTime, formatNullable } from '../utils/format';
import {
  isReceiptWorkbenchRowReceivable,
  resolveReceiptWorkbenchStatusLabel,
  resolveReceiptWorkbenchStatusTagType,
} from '../utils/specimen-receipt-workbench';
import {
  resolveReceiptWorkflowRowTone,
  resolveSpecimenWorkflowRowClassName,
} from '../utils/specimen-workflow-row-tone';

import '../styles/specimen-workflow-row-tone.css';

const route = useRoute();
const {
  batchRetryResult,
  closeReceiveDialog,
  directReceiveDialogVisible,
  directReceiveForm,
  directReceiveItems,
  directReceiveSubmitting,
  exportLoading,
  handleClearList,
  handleClearSelectionRows,
  handleDirectReceiveUserChange,
  handleExportExcel,
  handleOperatorChange,
  handleQueueSpecimen,
  handleReceiveUserChange,
  handleReceiveSelected,
  handleRemoveDirectReceiveRow,
  handleRetryLabel,
  handleSelectionChange,
  lookupLoading,
  openReceiveDialog,
  openDirectReceiveDrawer,
  operatorForm,
  pageError,
  queueItems,
  receiveDialogVisible,
  receiveForm,
  receiveLoading,
  receiveSummary,
  receivedCount,
  retryDialogVisible,
  retryForm,
  retrySubmitting,
  retryTargetRows,
  scanInput,
  selectedCount,
  selectedRowCount,
  submitDirectReceive,
  submitRetryLabel,
} = useSpecimenReceiptWorkbench();

function normalizeQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function resolveRowClassName({ row }: { row: ReceiptWorkbenchRow }) {
  return resolveSpecimenWorkflowRowClassName(
    resolveReceiptWorkflowRowTone(row),
  );
}

watch(
  () => route.query.barcode,
  (barcodeQuery) => {
    const normalizedBarcode = normalizeQueryValue(barcodeQuery).trim();
    if (
      !normalizedBarcode ||
      queueItems.value.some((item) => item.barcode === normalizedBarcode)
    ) {
      return;
    }
    scanInput.value = normalizedBarcode;
    void handleQueueSpecimen();
  },
  { immediate: true },
);
</script>

<template>
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <div class="flex flex-wrap items-center gap-4 text-sm">
        <div class="font-semibold text-danger">标本签收</div>
        <div>
          全部
          <span class="text-xl font-semibold text-primary">{{
            queueItems.length
          }}</span>
        </div>
        <div>
          接收
          <span class="text-xl font-semibold text-success">{{
            receivedCount
          }}</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <ElInput
          v-model="scanInput"
          clearable
          placeholder="请输入标本ID"
          style="width: 240px"
          @keyup.enter="handleQueueSpecimen"
        />
        <div class="w-[180px]">
          <SystemUserSelect
            v-model="operatorForm.operatorUserId"
            :selected-label="operatorForm.operatorName"
            placeholder="选择操作人"
            @change="handleOperatorChange"
          />
        </div>
        <ElButton
          :disabled="selectedCount === 0"
          :loading="receiveLoading"
          type="primary"
          @click="openReceiveDialog"
        >
          标本签收
        </ElButton>
        <ElButton @click="openDirectReceiveDrawer">异常接收</ElButton>
        <ElButton
          :disabled="selectedRowCount === 0"
          @click="handleClearSelectionRows"
        >
          清除选择行
        </ElButton>
        <ElButton :disabled="queueItems.length === 0" @click="handleClearList">
          清除列表
        </ElButton>
        <ElButton :disabled="queueItems.length === 0" @click="handleRetryLabel">
          补打标本标签
        </ElButton>
        <ElButton
          :disabled="queueItems.length === 0"
          :loading="exportLoading"
          @click="handleExportExcel"
        >
          导出Excel
        </ElButton>
      </div>

      <ElTable
        v-loading="lookupLoading || receiveLoading"
        :data="queueItems"
        :row-class-name="resolveRowClassName"
        border
        row-key="specimenId"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn
          :selectable="isReceiptWorkbenchRowReceivable"
          type="selection"
          width="42"
        />
        <ElTableColumn label="序" width="60">
          <template #default="{ $index }">
            {{ $index + 1 }}
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
        <ElTableColumn label="标本名称" min-width="160" prop="specimenName" />
        <ElTableColumn label="标本状态" min-width="120">
          <template #default="{ row }">
            <ElTag
              :type="resolveReceiptWorkbenchStatusTagType(row.queueStatus)"
            >
              {{ resolveReceiptWorkbenchStatusLabel(row.queueStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类型" min-width="100">
          <template #default="{ row }">
            {{ formatNullable(row.specimenType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="接收时间" min-width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.receivedAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="接收人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.receivedByName) }}
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

    <SpecimenReceiptDirectDrawer
      v-model="directReceiveDialogVisible"
      v-model:form="directReceiveForm"
      :items="directReceiveItems"
      :submitting="directReceiveSubmitting"
      @close="directReceiveDialogVisible = false"
      @direct-receive-user-change="handleDirectReceiveUserChange"
      @remove-row="handleRemoveDirectReceiveRow"
      @submit="submitDirectReceive"
    />

    <SpecimenReceiptReceiveDialog
      v-model="receiveDialogVisible"
      v-model:form="receiveForm"
      :submitting="receiveLoading"
      :summary="receiveSummary"
      @close="closeReceiveDialog"
      @receive-user-change="handleReceiveUserChange"
      @submit="handleReceiveSelected"
    />

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
          <div class="mb-4 text-base font-semibold text-foreground">
            补打范围
          </div>
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
          <div class="mb-4 text-base font-semibold text-foreground">
            补打结果
          </div>
          <div class="grid gap-3 text-sm md:grid-cols-2">
            <div>批次号：{{ batchRetryResult.labelPrintBatchNo }}</div>
            <div>
              结果：{{
                batchRetryResult.allSuccessful ? '全部成功' : '部分成功'
              }}
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
  </Page>
</template>
