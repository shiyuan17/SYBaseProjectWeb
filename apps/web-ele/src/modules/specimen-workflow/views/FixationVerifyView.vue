<script setup lang="ts">
import type { PendingSpecimenItem } from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

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
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  completeFixation,
  listPendingFixations,
  startFixation,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

type FixationAction = 'complete' | 'start';

const userStore = useUserStore();

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
});

const actionForm = reactive({
  fixationLiquidType: '',
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  remarks: '',
  specimenBarcode: '',
  terminalCode: '',
});

const currentQuery = computed(() => ({
  applicationId: filters.applicationId.trim() || undefined,
  dateFrom: filters.dateRange[0] || undefined,
  dateTo: filters.dateRange[1] || undefined,
  departmentId: filters.departmentId.trim() || undefined,
  page: filters.page,
  size: filters.size,
}));

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingFixations(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;
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
  void loadPendingData();
}

function adoptBarcode(barcode: string) {
  actionForm.specimenBarcode = barcode;
}

async function submitFixation(action: FixationAction, barcode?: string) {
  const specimenBarcode = (barcode ?? actionForm.specimenBarcode).trim();
  if (!specimenBarcode) {
    ElMessage.warning('请先录入或扫码标本条码');
    return;
  }
  if (!actionForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人');
    return;
  }

  actionLoading.value = true;
  pageError.value = '';
  try {
    const payload = {
      fixationLiquidType: actionForm.fixationLiquidType.trim() || null,
      operatorName: actionForm.operatorName.trim(),
      operatorUserId: actionForm.operatorUserId.trim() || null,
      remarks: actionForm.remarks.trim() || null,
      specimenBarcode,
      terminalCode: actionForm.terminalCode.trim() || null,
    };

    if (action === 'start') {
      await startFixation(payload);
      ElMessage.success(`条码 ${specimenBarcode} 已开始固定`);
    } else {
      await completeFixation(payload);
      ElMessage.success(`条码 ${specimenBarcode} 已完成固定`);
    }

    actionForm.specimenBarcode = '';
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

void loadPendingData();
</script>

<template>
  <Page
    title="固定核对"
    description="按待处理清单或扫码入口执行开始固定、完成固定，提交成功后工作台自动刷新。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="扫码优先操作"
        description="推荐使用扫码枪录入条码后直接回车或点击动作按钮，适合固定台主流程。"
      >
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="标本条码" required>
              <ElInput
                v-model="actionForm.specimenBarcode"
                clearable
                placeholder="扫码后回车"
                @keyup.enter="submitFixation('start')"
              />
            </ElFormItem>
            <ElFormItem label="操作人" required>
              <ElInput v-model="actionForm.operatorName" placeholder="请输入操作人姓名" />
            </ElFormItem>
            <ElFormItem label="操作人 ID">
              <ElInput v-model="actionForm.operatorUserId" placeholder="请输入操作人用户 ID" />
            </ElFormItem>
            <ElFormItem label="固定液类型">
              <ElInput v-model="actionForm.fixationLiquidType" placeholder="例如：10% 中性福尔马林" />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="actionForm.terminalCode" placeholder="工作站或扫码设备编码" />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput v-model="actionForm.remarks" placeholder="必要时补充固定说明" />
          </ElFormItem>
          <div class="flex justify-end gap-2">
            <ElButton :loading="actionLoading" type="primary" @click="submitFixation('start')">
              开始固定
            </ElButton>
            <ElButton :loading="actionLoading" type="success" @click="submitFixation('complete')">
              完成固定
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待固定列表"
        description="筛选条件固定为 applicationId / departmentId / 日期范围 / 分页，方便与后端分页协议一致。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="申请单 ID">
            <ElInput
              v-model="filters.applicationId"
              clearable
              placeholder="请输入 applicationId"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室 ID">
            <ElInput
              v-model="filters.departmentId"
              clearable
              placeholder="请输入 departmentId"
              style="width: 220px"
              @keyup.enter="handleSearch"
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
          <ElTableColumn label="固定状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.fixationStatus === 'COMPLETED' ? 'success' : 'warning'">
                {{ formatNullable(row.fixationStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="送检科室" min-width="160">
            <template #default="{ row }">
              {{ formatNullable(row.submittingDepartmentName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="登记时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.registeredAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="最近追踪" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.latestTrackingAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="220">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElButton link type="primary" @click="adoptBarcode(row.barcode)">
                  带入扫码框
                </ElButton>
                <ElButton
                  :loading="actionLoading"
                  link
                  type="primary"
                  @click="submitFixation('start', row.barcode)"
                >
                  开始固定
                </ElButton>
                <ElButton
                  :loading="actionLoading"
                  link
                  type="success"
                  @click="submitFixation('complete', row.barcode)"
                >
                  完成固定
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
            @current-change="loadPendingData"
            @size-change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
