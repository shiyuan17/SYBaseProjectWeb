<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  bindSpecimenBarcode,
  listSpecimens,
  rebindSpecimenBarcode,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatFixationStatus,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';

const MAX_QUERY_SIZE = 500;
const RECEIPT_LOCKED_STATUSES = ['RECEIVED', 'REJECTED', 'RETURNED'];

const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const pageError = ref('');
const eligibleItems = ref<SpecimenManagementListItem[]>([]);

const filters = reactive({
  keyword: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const pagedItems = computed(() => {
  const startIndex = (filters.page - 1) * filters.size;
  return eligibleItems.value.slice(startIndex, startIndex + filters.size);
});

const total = computed(() => eligibleItems.value.length);

const dialogVisible = ref(false);
const targetRow = ref<null | SpecimenManagementListItem>(null);
const bindingForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  targetBarcode: '',
  terminalCode: '',
});

const isRebinding = computed(() =>
  Boolean(targetRow.value?.barcode?.trim()),
);

function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.includes(row.specimenStatus ?? '');
}

function isVisibleInBindingScene(row: SpecimenManagementListItem) {
  return !isReceiptLocked(row) && row.checkInStatus !== 'CHECKED_IN';
}

async function loadSpecimens() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listSpecimens({
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      size: MAX_QUERY_SIZE,
    });
    eligibleItems.value = result.items.filter(isVisibleInBindingScene);
    if ((filters.page - 1) * filters.size >= eligibleItems.value.length) {
      filters.page = 1;
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadSpecimens();
}

function handleReset() {
  filters.keyword = '';
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  void loadSpecimens();
}

function openDialog(row: SpecimenManagementListItem) {
  if (isReceiptLocked(row)) {
    return;
  }
  targetRow.value = row;
  bindingForm.operatorName = userStore.userInfo?.realName ?? '';
  bindingForm.operatorUserId = userStore.userInfo?.userId ?? '';
  bindingForm.remarks = '';
  bindingForm.targetBarcode = row.barcode?.trim() ? `${row.barcode.trim()}-NEW` : '';
  bindingForm.terminalCode = '';
  dialogVisible.value = true;
}

async function submitBinding() {
  const row = targetRow.value;
  if (!row) {
    return;
  }
  if (!bindingForm.operatorName.trim()) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }
  if (!bindingForm.targetBarcode.trim()) {
    ElMessage.warning('请输入目标条码');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    if (isRebinding.value) {
      await rebindSpecimenBarcode(row.barcode || row.specimenId, {
        operatorName: bindingForm.operatorName.trim(),
        operatorUserId: bindingForm.operatorUserId.trim() || null,
        remarks: bindingForm.remarks.trim() || null,
        targetBarcode: bindingForm.targetBarcode.trim(),
        terminalCode: bindingForm.terminalCode.trim() || null,
      });
    } else {
      await bindSpecimenBarcode(row.specimenId, {
        operatorName: bindingForm.operatorName.trim(),
        operatorUserId: bindingForm.operatorUserId.trim() || null,
        remarks: bindingForm.remarks.trim() || null,
        targetBarcode: bindingForm.targetBarcode.trim(),
        terminalCode: bindingForm.terminalCode.trim() || null,
      });
    }
    ElMessage.success(isRebinding.value ? '条码重绑成功' : '条码绑定成功');
    dialogVisible.value = false;
    await loadSpecimens();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadSpecimens();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="pageError"
      class="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {{ pageError }}
    </div>

    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div class="text-sm text-muted-foreground">
        仅展示已登记、未入库且未进入接收结果的标本；已入库、已接收、已拒收、已退回标本不可再绑定或重绑条码。
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ElInput
          v-model="filters.keyword"
          clearable
          placeholder="申请单号 / 标本号 / 条码"
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>
    </div>

    <ElTable
      v-loading="loading"
      :data="pagedItems"
      border
      max-height="420"
    >
      <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
      <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
      <ElTableColumn label="当前条码" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.barcode) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本信息" min-width="220">
        <template #default="{ row }">
          <div class="flex flex-col gap-1 text-sm">
            <span>{{ row.specimenName }}</span>
            <span class="text-muted-foreground">{{ formatNullable(row.specimenSite) }}</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定/状态" min-width="180">
        <template #default="{ row }">
          <div class="flex flex-col gap-1 text-sm">
            <span>{{ formatFixationStatus(row.fixationStatus) }}</span>
            <span class="text-muted-foreground">{{ formatSpecimenStatus(row.specimenStatus) }}</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="最近追踪" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.latestTrackingAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="绑定状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="row.barcodeBindingStatus === 'BOUND' ? 'success' : 'info'">
            {{ row.barcodeBindingStatus === 'BOUND' ? '已绑定' : '未绑定' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" width="120">
        <template #default="{ row }">
          <ElButton
            link
            :disabled="isReceiptLocked(row)"
            type="primary"
            @click="openDialog(row)"
          >
            {{ row.barcode?.trim() ? '重绑条码' : '绑定条码' }}
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
    v-model="dialogVisible"
    destroy-on-close
    :title="isRebinding ? '条码重绑' : '条码绑定'"
    width="560px"
  >
    <template v-if="targetRow">
      <ElForm label-width="96px">
        <ElFormItem label="申请单号">
          <div>{{ targetRow.applicationNo }}</div>
        </ElFormItem>
        <ElFormItem label="标本号">
          <div>{{ targetRow.specimenNo }}</div>
        </ElFormItem>
        <ElFormItem label="当前条码">
          <div>{{ formatNullable(targetRow.barcode) }}</div>
        </ElFormItem>
        <ElFormItem label="目标条码" required>
          <ElInput v-model="bindingForm.targetBarcode" placeholder="请输入新条码" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="bindingForm.terminalCode" placeholder="工作站或扫码设备编号" />
        </ElFormItem>
        <ElFormItem label="说明">
          <ElInput v-model="bindingForm.remarks" placeholder="补充绑定说明" />
        </ElFormItem>
      </ElForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="actionLoading" type="primary" @click="submitBinding">
          提交
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
