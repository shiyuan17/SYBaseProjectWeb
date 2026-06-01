<script setup lang="ts">
import type {
  MedicalOrderActionRequest,
  PendingMedicalOrderItem,
} from '../types/doctor-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

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

import {
  acceptMedicalOrder,
  cancelMedicalOrder,
  completeMedicalOrder,
  listPendingMedicalOrders,
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

const accessStore = useAccessStore();
const userStore = useUserStore();

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
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  terminalCode: '',
});

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');
const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const canAccept = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_ACCEPT),
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
  { label: '已接收', value: 'ACCEPTED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
] as const;

function canAcceptOrder(row: PendingMedicalOrderItem) {
  return canAccept.value && row.status === 'PENDING';
}

function canCompleteOrder(row: PendingMedicalOrderItem) {
  return canComplete.value && row.status === 'ACCEPTED';
}

function canCancelOrder(row: PendingMedicalOrderItem) {
  return canCancel.value && row.status === 'PENDING';
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

function ensureOperator() {
  if (!actionForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

async function runOrderAction(
  action: 'accept' | 'cancel' | 'complete',
  row: PendingMedicalOrderItem,
) {
  if (!ensureOperator()) {
    return;
  }

  operating.value = true;
  try {
    const payload: MedicalOrderActionRequest = {
      operatorName: actionForm.operatorName.trim(),
      operatorUserId: actionForm.operatorUserId?.trim() || undefined,
      remarks: actionForm.remarks?.trim() || undefined,
      terminalCode: actionForm.terminalCode?.trim() || undefined,
    };
    if (action === 'accept') {
      await acceptMedicalOrder(row.orderId, payload);
      ElMessage.success('医嘱已接收');
    } else if (action === 'complete') {
      await completeMedicalOrder(row.orderId, payload);
      ElMessage.success('医嘱已完成');
    } else {
      await cancelMedicalOrder(row.orderId, payload);
      ElMessage.success('医嘱已取消');
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

watch(
  [currentUserId, currentUserName],
  ([userId, userName]) => {
    if (!actionForm.operatorUserId && userId) {
      actionForm.operatorUserId = userId;
    }
    if (!actionForm.operatorName && userName) {
      actionForm.operatorName = userName;
    }
  },
  { immediate: true },
);

void loadOrders();
</script>

<template>
  <Page
    title="病理医嘱执行"
    description="面向医嘱执行岗和管理员的医嘱工作台，支持查询、接收、完成和取消待处理医嘱。"
  >
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard
        title="查询条件"
        description="按病理号和状态筛选待处理医嘱。"
      >
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

      <WorkflowSectionCard
        title="执行操作"
        description="接收、完成和取消医嘱会使用统一操作人信息。"
      >
        <ElForm inline label-width="80px">
          <ElFormItem label="操作人">
            <ElInput
              v-model="actionForm.operatorName"
              placeholder="请输入操作人姓名"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem label="终端">
            <ElInput
              v-model="actionForm.terminalCode"
              placeholder="终端编码"
              style="width: 180px"
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="actionForm.remarks"
              placeholder="备注"
              style="width: 260px"
            />
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <ElEmpty
        v-if="!loading && !pageError && orders.length === 0"
        description="暂无医嘱数据"
      />

      <WorkflowSectionCard
        title="医嘱列表"
        :description="`当前共 ${total} 条记录，支持在表格中直接执行主动作。`"
      >
        <ElEmpty v-if="false" :description="pageError" />
        <ElTable v-else v-loading="loading" :data="orders" border>
          <ElTableColumn label="医嘱号" min-width="150" prop="orderNumber" />
          <ElTableColumn label="病理号" min-width="140" prop="pathologyNo" />
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
              {{ formatNullable(row.billingStatus) }}
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
          <ElTableColumn label="接收时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.acceptedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="完成时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.completedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="220">
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
                  接收
                </ElButton>
                <ElButton
                  v-if="canComplete"
                  :disabled="!canCompleteOrder(row)"
                  :loading="operating"
                  size="small"
                  type="success"
                  @click="runOrderAction('complete', row)"
                >
                  完成
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
