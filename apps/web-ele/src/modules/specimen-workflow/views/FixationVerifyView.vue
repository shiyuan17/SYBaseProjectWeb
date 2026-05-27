<script setup lang="ts">
import type { PendingSpecimenItem } from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
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
  completeSpecimenVerification,
  listPendingFixations,
  startSpecimenVerification,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  ALL_VERIFICATION_STATUS_VALUE,
  DEFAULT_PAGE_SIZE,
  VERIFICATION_STATUS_OPTIONS,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
  formatVerificationStatus,
} from '../utils/format';

const userStore = useUserStore();
const route = useRoute();

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const pageError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingSpecimenItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationId: '',
  dateRange: [] as string[],
  departmentId: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  verificationStatus: ALL_VERIFICATION_STATUS_VALUE,
});

const currentQuery = computed(() => ({
  applicationId: filters.applicationId.trim() || undefined,
  dateFrom: filters.dateRange[0] || undefined,
  dateTo: filters.dateRange[1] || undefined,
  departmentId: filters.departmentId.trim() || undefined,
  page: filters.page,
  size: filters.size,
  verificationStatus:
    filters.verificationStatus === ALL_VERIFICATION_STATUS_VALUE
      ? undefined
      : filters.verificationStatus.trim() || undefined,
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

function canStartVerification(row: PendingSpecimenItem) {
  return row.verificationStatus === 'UNVERIFIED';
}

function canCompleteVerification(row: PendingSpecimenItem) {
  return row.verificationStatus === 'VERIFYING';
}

function handleDepartmentChange(department: null | { id: string; name: string }) {
  filters.departmentId = department?.id ?? '';
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingFixations(currentQuery.value);
    pendingItems.value = result.items.filter((item) =>
      ['UNVERIFIED', 'VERIFYING'].includes(item.verificationStatus ?? 'UNVERIFIED'),
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
  filters.page = 1;
  filters.size = DEFAULT_PAGE_SIZE;
  filters.verificationStatus = ALL_VERIFICATION_STATUS_VALUE;
  void loadPendingData();
}

async function submitStartVerification(row: PendingSpecimenItem) {
  const specimenBarcode = row.barcode.trim();
  const operatorName = userStore.userInfo?.realName?.trim() ?? '';
  const operatorUserId = userStore.userInfo?.userId?.trim() ?? '';

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫描标本条码');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    await startSpecimenVerification({
      operatorName,
      operatorUserId: operatorUserId || null,
      specimenBarcode,
    });
    ElMessage.success(`条码 ${specimenBarcode} 已开始核对`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function submitCompleteVerification(row: PendingSpecimenItem) {
  const specimenBarcode = row.barcode.trim();
  const operatorName = userStore.userInfo?.realName?.trim() ?? '';
  const operatorUserId = userStore.userInfo?.userId?.trim() ?? '';

  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫描标本条码');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('缺少当前操作人信息');
    return;
  }

  try {
    await ElMessageBox.confirm('确认该标本已完成核对吗？', '完成核对', {
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
    await completeSpecimenVerification({
      operatorName,
      operatorUserId: operatorUserId || null,
      specimenBarcode,
    });
    ElMessage.success(`条码 ${specimenBarcode} 已完成核对`);
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
  <Page :title="embedded ? '标本核对' : '固定与转运'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="标本核对"
        description="按申请单号、核对状态、送检科室和登记日期筛选标本，并在当前场景完成开始核对或完成核对。"
      >
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
          <ElFormItem label="核对状态">
            <ElSelect
              v-model="filters.verificationStatus"
              placeholder="请选择核对状态"
              style="width: 180px"
            >
              <ElOption
                v-for="option in VERIFICATION_STATUS_OPTIONS"
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
              <ElTag
                :type="
                  row.verificationStatus === 'VERIFIED'
                    ? 'success'
                    : row.verificationStatus === 'VERIFYING'
                      ? 'warning'
                      : 'info'
                "
              >
                {{ formatVerificationStatus(row.verificationStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="开始核对时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.verificationStartedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="完成核对时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.verificationCompletedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="最近追踪" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.latestTrackingAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="220">
            <template #default="{ row }">
              <div class="flex flex-nowrap items-center gap-3 whitespace-nowrap">
                <ElButton
                  v-if="canStartVerification(row)"
                  :loading="actionLoading"
                  link
                  type="primary"
                  @click="submitStartVerification(row)"
                >
                  开始核对
                </ElButton>
                <ElButton
                  v-if="canCompleteVerification(row)"
                  :loading="actionLoading"
                  link
                  type="success"
                  @click="submitCompleteVerification(row)"
                >
                  完成核对
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="filters.page"
            v-model:page-size="filters.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next"
          />
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
