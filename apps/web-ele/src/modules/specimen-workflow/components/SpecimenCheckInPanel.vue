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
  checkInSpecimen,
  listSpecimens,
} from '../api/specimen-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCheckInStatus,
  formatDateTime,
  formatNullable,
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
const checkInForm = reactive({
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  terminalCode: '',
});

const pendingCheckInItems = computed(() =>
  eligibleItems.value.filter((item) => item.checkInStatus !== 'CHECKED_IN'),
);

function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.includes(row.specimenStatus ?? '');
}

function isVisibleInCheckInScene(row: SpecimenManagementListItem) {
  return (
    row.verificationStatus === 'VERIFIED'
    && row.fixationStatus === 'COMPLETED'
    && Boolean(row.specimenConfirmedAt)
    && !isReceiptLocked(row)
  );
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
    eligibleItems.value = result.items.filter(isVisibleInCheckInScene);
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
  if (row.checkInStatus === 'CHECKED_IN') {
    return;
  }
  targetRow.value = row;
  checkInForm.operatorName = userStore.userInfo?.realName ?? '';
  checkInForm.operatorUserId = userStore.userInfo?.userId ?? '';
  checkInForm.remarks = '';
  checkInForm.terminalCode = '';
  dialogVisible.value = true;
}

async function submitCheckIn() {
  const row = targetRow.value;
  if (!row) {
    return;
  }
  if (!checkInForm.operatorName.trim()) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await checkInSpecimen(row.barcode || row.specimenId, {
      operatorName: checkInForm.operatorName.trim(),
      operatorUserId: checkInForm.operatorUserId.trim() || null,
      remarks: checkInForm.remarks.trim() || null,
      specimenBarcode: row.barcode || row.specimenId,
      terminalCode: checkInForm.terminalCode.trim() || null,
    });
    ElMessage.success('标本入库成功');
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
        仅展示已完成标本确认且未进入接收终态的标本；入库后才能进入转运/出库场景建单。
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

    <div class="text-sm text-muted-foreground">
      待入库 {{ pendingCheckInItems.length }} 条
    </div>

    <ElTable
      v-loading="loading"
      :data="pagedItems"
      border
      max-height="420"
    >
      <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
      <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
      <ElTableColumn label="条码" min-width="180">
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
      <ElTableColumn label="确认时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.specimenConfirmedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库状态" min-width="120">
        <template #default="{ row }">
          <ElTag :type="row.checkInStatus === 'CHECKED_IN' ? 'success' : 'warning'">
            {{ formatCheckInStatus(row.checkInStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.checkedInAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="入库人" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.checkedInByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" width="120">
        <template #default="{ row }">
          <ElButton
            link
            :disabled="row.checkInStatus === 'CHECKED_IN'"
            type="primary"
            @click="openDialog(row)"
          >
            执行入库
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
    title="标本入库"
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
        <ElFormItem label="终端编码">
          <ElInput v-model="checkInForm.terminalCode" placeholder="工作站或扫码设备编号" />
        </ElFormItem>
        <ElFormItem label="入库说明">
          <ElInput v-model="checkInForm.remarks" placeholder="补充入库说明" />
        </ElFormItem>
      </ElForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="actionLoading" type="primary" @click="submitCheckIn">
          确认入库
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
