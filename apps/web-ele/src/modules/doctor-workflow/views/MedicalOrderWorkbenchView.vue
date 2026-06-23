<script setup lang="ts">
import type {
  MedicalOrderActionRequest,
  PendingMedicalOrderItem,
} from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import CopyableIdentifier from '../../../components/CopyableIdentifier.vue';
import {
  acceptMedicalOrder,
  cancelMedicalOrder,
  completeMedicalOrder,
  listPendingMedicalOrders,
  printMedicalOrderSlide,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatMedicalOrderStatus,
  formatMedicalOrderType,
  formatNullable,
} from '../utils/format';
import { openMedicalOrderPrintWindow } from '../utils/medical-order-print';

const accessStore = useAccessStore();

const loading = ref(false);
const operating = ref(false);
const pageError = ref('');
const total = ref(0);
const orders = ref<PendingMedicalOrderItem[]>([]);

const queryForm = reactive({
  pathologyNo: '',
  status: '',
});

const actionForm = reactive<MedicalOrderActionRequest>({
  remarks: '',
  terminalCode: '',
});

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canAccept = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_ACCEPT),
);
const canPrint = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_PRINT),
);
const canComplete = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_COMPLETE),
);
const canCancel = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL),
);

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'PENDING' },
  { label: '已确认', value: 'ACCEPTED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
] as const;

function resolveBooleanFlag(value: boolean | undefined, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function isTerminatedOrder(row: PendingMedicalOrderItem) {
  return (
    row.status?.trim().toUpperCase() === 'TERMINATED' ||
    Boolean(row.terminatedAt?.trim())
  );
}

function canAcceptOrder(row: PendingMedicalOrderItem) {
  return (
    canAccept.value &&
    resolveBooleanFlag(row.canConfirm, row.status === 'PENDING')
  );
}

function canPrintOrder(row: PendingMedicalOrderItem) {
  return (
    canPrint.value &&
    resolveBooleanFlag(
      row.canPrint,
      row.status === 'IN_PROGRESS' && !row.printedAt && !isTerminatedOrder(row),
    )
  );
}

function canCompleteOrder(row: PendingMedicalOrderItem) {
  return (
    canComplete.value &&
    resolveBooleanFlag(
      row.canRelease,
      row.status === 'IN_PROGRESS' &&
        Boolean(row.printedAt) &&
        !isTerminatedOrder(row),
    )
  );
}

function canCancelOrder(row: PendingMedicalOrderItem) {
  return canCancel.value && row.status === 'PENDING';
}

function formatBillingStatus(value?: null | string) {
  const labels: Record<string, string> = {
    BILLED: '已计费',
    CHARGED: '已收费',
    PAID: '已收费',
    PENDING: '待收费',
    REFUNDED: '已退费',
    SETTLED: '已收费',
    SUCCESS: '已收费',
    UNBILLED: '未收费',
    UNCHARGED: '未收费',
  };
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return formatNullable(value);
  }
  return labels[normalizedValue] ?? formatNullable(value);
}

function formatPrintStatus(row: PendingMedicalOrderItem) {
  return row.printedAt ? '已打印' : '未打印';
}

async function loadOrders() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingMedicalOrders({
      page: 1,
      pathologyNo: queryForm.pathologyNo.trim() || undefined,
      size: 50,
      status: queryForm.status || undefined,
    });
    orders.value = result.items;
    total.value = result.total;
  } catch (error) {
    orders.value = [];
    total.value = 0;
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function runOrderAction(
  action: 'accept' | 'cancel' | 'complete' | 'print',
  row: PendingMedicalOrderItem,
) {
  operating.value = true;
  try {
    const payload: MedicalOrderActionRequest = {
      remarks: actionForm.remarks?.trim() || undefined,
      terminalCode: actionForm.terminalCode?.trim() || undefined,
    };
    switch (action) {
      case 'accept': {
        await acceptMedicalOrder(row.orderId, payload);
        ElMessage.success('医嘱已确认');
        break;
      }
      case 'cancel': {
        await cancelMedicalOrder(row.orderId, payload);
        ElMessage.success('医嘱已取消');
        break;
      }
      case 'complete': {
        await completeMedicalOrder(row.orderId, payload);
        ElMessage.success('医嘱已出片');
        break;
      }
      case 'print': {
        const result = await printMedicalOrderSlide(row.orderId, payload);
        if (
          result.labels.length === 0 ||
          !openMedicalOrderPrintWindow(result.labels)
        ) {
          ElMessage.warning('未能打开打印窗口，请检查浏览器弹窗权限');
        } else {
          ElMessage.success('玻片已打印');
        }
        break;
      }
    }
    await loadOrders();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function handleReset() {
  queryForm.pathologyNo = '';
  queryForm.status = '';
  void loadOrders();
}

void loadOrders();
</script>

<template>
  <Page
    :show-header="false"
    title="病理医嘱执行"
    description="面向医嘱执行岗和管理员的医嘱工作台，支持查询、确认、打印玻片、出片和取消待处理医嘱。"
  >
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard title="查询条件">
        <ElForm inline label-width="88px">
          <ElFormItem label="病理号">
            <ElInput
              v-model="queryForm.pathologyNo"
              clearable
              placeholder="请输入病理号"
              style="width: 220px"
              @keyup.enter="loadOrders"
            />
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect
              v-model="queryForm.status"
              placeholder="全部状态"
              style="width: 180px"
            >
              <ElOption
                v-for="option in STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadOrders">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <ElEmpty
        v-if="!loading && !pageError && orders.length === 0"
        description="暂无医嘱数据"
      />

      <WorkflowSectionCard title="医嘱列表">
        <ElEmpty v-if="false" :description="pageError" />
        <ElTable v-else v-loading="loading" :data="orders" border>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              <CopyableIdentifier kind="pathologyNo" :value="row.pathologyNo" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="患者" min-width="120" prop="patientName" />
          <ElTableColumn label="类型" min-width="130">
            <template #default="{ row }">
              {{ formatMedicalOrderType(row.orderType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="内容" min-width="220" prop="orderContent" />
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              {{ formatMedicalOrderStatus(row.status) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="收费状态" min-width="120">
            <template #default="{ row }">
              {{ formatBillingStatus(row.billingStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="开单医生" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.doctorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="执行人" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.executorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="开单时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.orderDate) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="确认时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.acceptedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="打印状态" min-width="110">
            <template #default="{ row }">
              {{ formatPrintStatus(row) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="打印时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.printedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="出片时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.completedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="320">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElButton
                  v-if="canAccept"
                  :disabled="!canAcceptOrder(row)"
                  :loading="operating"
                  size="small"
                  type="primary"
                  @click="runOrderAction('accept', row)"
                >
                  确认
                </ElButton>
                <ElButton
                  v-if="canPrint"
                  :disabled="!canPrintOrder(row)"
                  :loading="operating"
                  size="small"
                  @click="runOrderAction('print', row)"
                >
                  打印玻片
                </ElButton>
                <ElButton
                  v-if="canComplete"
                  :disabled="!canCompleteOrder(row)"
                  :loading="operating"
                  size="small"
                  type="success"
                  @click="runOrderAction('complete', row)"
                >
                  出片
                </ElButton>
                <ElButton
                  v-if="canCancel"
                  :disabled="!canCancelOrder(row)"
                  :loading="operating"
                  size="small"
                  type="danger"
                  @click="runOrderAction('cancel', row)"
                >
                  取消
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
