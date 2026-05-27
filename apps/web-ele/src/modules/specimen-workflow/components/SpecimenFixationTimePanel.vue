<script setup lang="ts">
import type { PendingSpecimenItem } from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  completeFixation,
  listPendingFixations,
  startFixation,
} from '../api/specimen-workflow-service';
import {
  ALL_FIXATION_STATUS_VALUE,
  DEFAULT_PAGE_SIZE,
  FIXATION_STATUS_OPTIONS,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatFixationStatus,
  formatNullable,
  formatVerificationStatus,
} from '../utils/format';

const userStore = useUserStore();
const route = useRoute();

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingSpecimenItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationId: '',
  dateRange: [] as string[],
  departmentId: '',
  fixationStatus: ALL_FIXATION_STATUS_VALUE,
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const currentQuery = computed(() => ({
  applicationId: filters.applicationId.trim() || undefined,
  dateFrom: filters.dateRange[0] || undefined,
  dateTo: filters.dateRange[1] || undefined,
  departmentId: filters.departmentId.trim() || undefined,
  fixationStatus:
    filters.fixationStatus === ALL_FIXATION_STATUS_VALUE
      ? undefined
      : filters.fixationStatus.trim() || undefined,
  page: filters.page,
  size: filters.size,
}));

function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function handleDepartmentChange(department: null | { id: string; name: string }) {
  filters.departmentId = department?.id ?? '';
}

function canStartFixation(row: PendingSpecimenItem) {
  return row.fixationStatus === 'PENDING' && row.verificationStatus === 'VERIFIED';
}

function canCompleteFixation(row: PendingSpecimenItem) {
  return row.fixationStatus === 'FIXING';
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingFixations(currentQuery.value);
    pendingItems.value = result.items.filter((item) =>
      item.fixationStatus === 'FIXING'
      || item.fixationStatus === 'COMPLETED'
      || item.verificationStatus === 'VERIFIED',
    );
    total.value = pendingItems.value.length;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
}

function handleReset() {
  filters.applicationId = '';
  filters.dateRange = [];
  filters.departmentId = '';
  filters.fixationStatus = ALL_FIXATION_STATUS_VALUE;
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  void loadPendingData();
}

async function submitStartFixation(row: PendingSpecimenItem) {
  const specimenBarcode = row.barcode.trim();
  const operatorName = userStore.userInfo?.realName?.trim() ?? '';
  const operatorUserId = userStore.userInfo?.userId?.trim() ?? '';

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫码标本条码');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await startFixation({
      fixationLiquidType: row.fixationLiquidType ?? null,
      operatorName,
      operatorUserId: operatorUserId || null,
      specimenBarcode,
    });
    ElMessage.success(`条码 ${specimenBarcode} 已开始固定`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitCompleteFixation(row: PendingSpecimenItem) {
  const specimenBarcode = row.barcode.trim();
  const operatorName = userStore.userInfo?.realName?.trim() ?? '';
  const operatorUserId = userStore.userInfo?.userId?.trim() ?? '';

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫码标本条码');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  try {
    await ElMessageBox.confirm('确认该标本已完成固定吗？', '完成固定', {
      cancelButtonText: '取消',
      confirmButtonText: '确认',
      type: 'warning',
    });
  } catch {
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await completeFixation({
      fixationLiquidType: row.fixationLiquidType ?? null,
      operatorName,
      operatorUserId: operatorUserId || null,
      specimenBarcode,
    });
    ElMessage.success(`条码 ${specimenBarcode} 已完成固定`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

watch(
  () => route.query.applicationId,
  (value) => {
    filters.applicationId = normalizeRouteQueryValue(value).trim();
    filters.page = 1;
    void loadPendingData();
  },
  { immediate: true },
);
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

    <div class="text-sm text-muted-foreground">
      仅展示已完成核对且未进入接收终态的标本；核对未完成的标本请先在“标本核对”场景处理。
    </div>

    <ElForm inline label-width="88px">
      <ElFormItem label="申请单号">
        <ElInput
          v-model="filters.applicationId"
          clearable
          placeholder="请输入申请单号"
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem label="固定状态">
        <ElSelect
          v-model="filters.fixationStatus"
          placeholder="请选择固定状态"
          style="width: 180px"
        >
          <ElOption
            v-for="option in FIXATION_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="送检科室">
        <DepartmentSelect
          v-model="filters.departmentId"
          placeholder="请选择送检科室"
          @change="handleDepartmentChange"
        />
      </ElFormItem>
      <ElFormItem label="登记日期">
        <ElDatePicker
          v-model="filters.dateRange"
          end-placeholder="结束日期"
          range-separator="至"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable v-loading="loading" :data="pendingItems" border>
      <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
      <ElTableColumn label="患者姓名" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
      <ElTableColumn label="条码" min-width="180" prop="barcode" />
      <ElTableColumn label="核对状态" min-width="120">
        <template #default="{ row }">
          {{ formatVerificationStatus(row.verificationStatus) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定状态" min-width="120">
        <template #default="{ row }">
          <ElTag
            :type="
              row.fixationStatus === 'COMPLETED'
                ? 'success'
                : row.fixationStatus === 'FIXING'
                  ? 'warning'
                  : 'info'
            "
          >
            {{ formatFixationStatus(row.fixationStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="固定液类型" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.fixationLiquidType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="开始固定时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.fixationStartedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="完成固定时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.fixationCompletedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="最近追踪" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.latestTrackingAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="180">
        <template #default="{ row }">
          <div class="flex flex-nowrap items-center gap-3 whitespace-nowrap">
            <ElButton
              v-if="canStartFixation(row)"
              :loading="actionLoading"
              link
              type="primary"
              @click="submitStartFixation(row)"
            >
              开始固定
            </ElButton>
            <ElButton
              v-if="canCompleteFixation(row)"
              :loading="actionLoading"
              link
              type="success"
              @click="submitCompleteFixation(row)"
            >
              完成固定
            </ElButton>
          </div>
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
        @current-change="loadPendingData"
        @size-change="loadPendingData"
      />
    </div>
  </div>
</template>
