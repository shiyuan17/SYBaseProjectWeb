<script setup lang="ts">
import type {
  BillingReceiptRequest,
  BillingRecordQuery,
  OperatorRequest,
  ReconcileBillingRequest,
} from '../types/m6-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import WorkflowSectionCard from '#/modules/doctor-workflow/components/WorkflowSectionCard.vue';

import { getBillingManagementCapabilities } from '../access';
import {
  listBillingRecords,
  receiveBillingReceipt,
  reconcileBilling,
  retryBilling,
} from '../api/m6-management-service';

const accessStore = useAccessStore();
const userStore = useUserStore();

const capabilities = computed(() =>
  getBillingManagementCapabilities(accessStore.accessCodes),
);

const loading = ref(false);
const pageError = ref('');
const operating = ref(false);
const receiptDialogVisible = ref(false);
const reconcileSummary = ref('');
const selectedBillingId = ref('');
const records = ref([] as Awaited<ReturnType<typeof listBillingRecords>>);

const queryForm = reactive<BillingRecordQuery>({
  billingStage: '',
  billingStatus: '',
  caseId: '',
  externalSystem: '',
  from: '',
  orderId: '',
  to: '',
});

const operatorForm = reactive<OperatorRequest>({
  operatorName: '',
  operatorUserId: '',
});

const receiptForm = reactive<BillingReceiptRequest>({
  billingStatus: 'SUCCESS',
  externalBillNo: '',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
});

const reconcileForm = reactive<ReconcileBillingRequest>({
  from: '',
  operatorName: '',
  operatorUserId: '',
  to: '',
});

function displayText(value?: null | string) {
  return value?.trim() ? value : '-';
}

function buildOperatorPayload() {
  return {
    operatorName: operatorForm.operatorName?.trim() || undefined,
    operatorUserId: operatorForm.operatorUserId?.trim() || undefined,
  };
}

async function loadRecords() {
  loading.value = true;
  pageError.value = '';
  try {
    records.value = await listBillingRecords({
      billingStage: queryForm.billingStage?.trim() || undefined,
      billingStatus: queryForm.billingStatus?.trim() || undefined,
      caseId: queryForm.caseId?.trim() || undefined,
      externalSystem: queryForm.externalSystem?.trim() || undefined,
      from: queryForm.from?.trim() || undefined,
      orderId: queryForm.orderId?.trim() || undefined,
      to: queryForm.to?.trim() || undefined,
    });
  } catch (error) {
    records.value = [];
    pageError.value =
      error instanceof Error ? error.message : '收费记录加载失败';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  queryForm.billingStage = '';
  queryForm.billingStatus = '';
  queryForm.caseId = '';
  queryForm.externalSystem = '';
  queryForm.from = '';
  queryForm.orderId = '';
  queryForm.to = '';
  reconcileSummary.value = '';
  void loadRecords();
}

function openReceiptDialog(id: string) {
  selectedBillingId.value = id;
  receiptForm.externalBillNo = '';
  receiptForm.billingStatus = 'SUCCESS';
  receiptForm.operatorName = operatorForm.operatorName;
  receiptForm.operatorUserId = operatorForm.operatorUserId;
  receiptForm.remarks = '';
  receiptDialogVisible.value = true;
}

async function handleRetry(id: string) {
  operating.value = true;
  try {
    await retryBilling(id, buildOperatorPayload());
    ElMessage.success('收费重试已提交');
    await loadRecords();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '收费重试失败');
  } finally {
    operating.value = false;
  }
}

async function submitReceipt() {
  if (!selectedBillingId.value) {
    return;
  }

  operating.value = true;
  try {
    await receiveBillingReceipt(selectedBillingId.value, {
      billingStatus: receiptForm.billingStatus?.trim() || undefined,
      externalBillNo: receiptForm.externalBillNo?.trim() || undefined,
      operatorName: receiptForm.operatorName?.trim() || undefined,
      operatorUserId: receiptForm.operatorUserId?.trim() || undefined,
      remarks: receiptForm.remarks?.trim() || undefined,
    });
    receiptDialogVisible.value = false;
    ElMessage.success('收费回执已登记');
    await loadRecords();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '收费回执登记失败',
    );
  } finally {
    operating.value = false;
  }
}

async function handleReconcile() {
  operating.value = true;
  try {
    const result = await reconcileBilling({
      from: reconcileForm.from?.trim() || undefined,
      operatorName: reconcileForm.operatorName?.trim() || undefined,
      operatorUserId: reconcileForm.operatorUserId?.trim() || undefined,
      to: reconcileForm.to?.trim() || undefined,
    });
    reconcileSummary.value = `对账完成：总数 ${result.totalCount}，匹配 ${result.matchedCount}，差异 ${result.discrepancyCount}`;
    ElMessage.success('收费对账已执行');
    await loadRecords();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '收费对账失败');
  } finally {
    operating.value = false;
  }
}

watch(
  () => [userStore.userInfo?.realName, userStore.userInfo?.userId],
  ([realName, userId]) => {
    const normalizedName = realName ?? '';
    const normalizedUserId = userId ?? '';
    if (!operatorForm.operatorName) {
      operatorForm.operatorName = normalizedName;
    }
    if (!operatorForm.operatorUserId) {
      operatorForm.operatorUserId = normalizedUserId;
    }
    if (!receiptForm.operatorName) {
      receiptForm.operatorName = normalizedName;
    }
    if (!receiptForm.operatorUserId) {
      receiptForm.operatorUserId = normalizedUserId;
    }
    if (!reconcileForm.operatorName) {
      reconcileForm.operatorName = normalizedName;
    }
    if (!reconcileForm.operatorUserId) {
      reconcileForm.operatorUserId = normalizedUserId;
    }
  },
  { immediate: true },
);

onMounted(() => {
  void loadRecords();
});
</script>

<template>
  <Page
    title="收费管理"
    description="查询收费记录，并执行重试、回执登记和时间窗对账。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="false"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="查询条件"
        description="按收费阶段、状态、病例、医嘱和外部系统筛选收费记录。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="收费阶段">
            <ElInput
              v-model="queryForm.billingStage"
              placeholder="如 SPECIAL_ORDER"
            />
          </ElFormItem>
          <ElFormItem label="收费状态">
            <ElInput
              v-model="queryForm.billingStatus"
              placeholder="如 FAILED / SUCCESS"
            />
          </ElFormItem>
          <ElFormItem label="病例 ID">
            <ElInput v-model="queryForm.caseId" placeholder="病例主键" />
          </ElFormItem>
          <ElFormItem label="医嘱 ID">
            <ElInput v-model="queryForm.orderId" placeholder="医嘱主键" />
          </ElFormItem>
          <ElFormItem label="外部系统">
            <ElInput
              v-model="queryForm.externalSystem"
              placeholder="如 MOCK_BILLING"
            />
          </ElFormItem>
          <ElFormItem label="起始时间">
            <ElInput
              v-model="queryForm.from"
              placeholder="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="结束时间">
            <ElInput v-model="queryForm.to" placeholder="YYYY-MM-DDTHH:mm:ss" />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadRecords">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="执行信息"
        description="重试、回执登记和对账动作统一记录操作人信息。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="操作人">
            <ElInput v-model="operatorForm.operatorName" />
          </ElFormItem>
          <ElFormItem label="操作人 ID">
            <ElInput v-model="operatorForm.operatorUserId" />
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="收费对账"
        description="按时间窗发起对账，核查收费与回执是否一致。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="起始时间">
            <ElInput
              v-model="reconcileForm.from"
              placeholder="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="结束时间">
            <ElInput
              v-model="reconcileForm.to"
              placeholder="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              v-if="capabilities.canReconcile"
              :loading="operating"
              type="warning"
              @click="handleReconcile"
            >
              执行对账
            </ElButton>
          </ElFormItem>
        </ElForm>
        <div v-if="reconcileSummary" class="mt-3 text-sm text-muted-foreground">
          {{ reconcileSummary }}
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="收费记录"
        :description="`当前返回 ${records.length} 条收费记录。`"
      >
        <ElEmpty
          v-if="!loading && records.length === 0 && !pageError"
          description="暂无收费记录"
        />
        <ElTable v-else v-loading="loading" :data="records" border>
          <ElTableColumn label="收费单号" min-width="160" prop="billingNo" />
          <ElTableColumn label="收费阶段" min-width="130" prop="billingStage" />
          <ElTableColumn label="项目名称" min-width="180" prop="itemName" />
          <ElTableColumn label="金额" min-width="120" prop="amount" />
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              <ElTag
                :type="
                  row.billingStatus === 'SUCCESS'
                    ? 'success'
                    : row.billingStatus === 'FAILED'
                      ? 'danger'
                      : 'warning'
                "
              >
                {{ displayText(row.billingStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="补偿状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.compensationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对账状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.reconciliationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="外部流水号" min-width="180">
            <template #default="{ row }">
              {{ displayText(row.externalBillNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="错误码" min-width="140">
            <template #default="{ row }">
              {{ displayText(row.lastErrorCode) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="220">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElButton
                  v-if="capabilities.canRetryBilling"
                  :loading="operating"
                  size="small"
                  type="warning"
                  @click="handleRetry(row.id)"
                >
                  重试
                </ElButton>
                <ElButton
                  v-if="capabilities.canReceiveReceipt"
                  :loading="operating"
                  size="small"
                  type="primary"
                  @click="openReceiptDialog(row.id)"
                >
                  登记回执
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>
    </div>

    <ElDialog v-model="receiptDialogVisible" title="登记收费回执" width="560px">
      <ElForm label-width="100px">
        <ElFormItem label="外部流水号">
          <ElInput v-model="receiptForm.externalBillNo" />
        </ElFormItem>
        <ElFormItem label="收费状态">
          <ElInput v-model="receiptForm.billingStatus" />
        </ElFormItem>
        <ElFormItem label="操作人">
          <ElInput v-model="receiptForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="操作人 ID">
          <ElInput v-model="receiptForm.operatorUserId" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="receiptForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="receiptDialogVisible = false">取消</ElButton>
        <ElButton :loading="operating" type="primary" @click="submitReceipt">
          提交回执
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
