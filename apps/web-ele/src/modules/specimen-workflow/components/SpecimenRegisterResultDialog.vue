<script setup lang="ts">
import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatCurrentNode, formatNullable } from '../utils/format';

const props = withDefaults(
  defineProps<{
    applicationId: string;
    modelValue: boolean;
    registerResult?: null | SpecimenRegisterResult;
  }>(),
  {
    registerResult: null,
  },
);

const emit = defineEmits<{
  'update:modelValue': [boolean];
}>();

const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canQueryApplicationDetail = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const applicationDetail = ref<ApplicationDetailView | null>(null);
const currentApplicationId = ref('');
const loadingDetail = ref(false);
const loadingResult = ref(false);
const pageError = ref('');
const latestRegisterResult = ref<
  LatestSpecimenRegistrationResult | null | SpecimenRegisterResult
>(null);

function resetDialogState() {
  pageError.value = '';
  applicationDetail.value = null;
  currentApplicationId.value = props.applicationId.trim();
  latestRegisterResult.value = props.registerResult;
}

async function loadApplicationDetail() {
  if (!currentApplicationId.value) {
    return;
  }
  if (!canQueryApplicationDetail.value) {
    return;
  }

  loadingDetail.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(
      currentApplicationId.value,
    );
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function loadLatestRegisterResult() {
  if (!currentApplicationId.value) {
    return;
  }
  loadingResult.value = true;
  try {
    const result = await getLatestRegistrationResult(
      currentApplicationId.value,
    );
    latestRegisterResult.value = result.labelPrintBatchNo
      ? result
      : props.registerResult;
  } catch (error) {
    if (!props.registerResult) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
    latestRegisterResult.value = props.registerResult;
  } finally {
    loadingResult.value = false;
  }
}

function closeDialog() {
  dialogVisible.value = false;
}

const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);

async function refreshDialog() {
  await Promise.all([loadApplicationDetail(), loadLatestRegisterResult()]);
}

watch(
  () => [props.applicationId, props.modelValue],
  async ([, visible]) => {
    if (!visible) {
      return;
    }
    resetDialogState();
    await refreshDialog();
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="登记结果"
    top="6vh"
    width="1280px"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElAlert
        v-if="!canQueryApplicationDetail"
        :closable="false"
        title="当前账号没有申请单详情查询权限，弹窗中仅展示本次缓存的登记结果。"
        type="info"
        show-icon
      />

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-4">
          <div class="text-base font-semibold text-foreground">当前上下文</div>
          <ElButton
            :loading="loadingDetail || loadingResult"
            @click="refreshDialog()"
          >
            刷新详情
          </ElButton>
        </div>

        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="申请单编号">
            {{ currentApplicationId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(applicationDetail?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatCurrentNode(applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者姓名">
            {{ formatNullable(applicationDetail?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(applicationDetail?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="异常标记">
            <ElTag :type="detailStatusType">
              {{ applicationDetail?.abnormalFlag ? '有异常' : '正常' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">结果详情</div>

        <template v-if="latestRegisterResult">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="标签批次号">
              {{ latestRegisterResult.labelPrintBatchNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="打印结果">
              <ElTag
                :type="
                  latestRegisterResult.labelPrintSuccess ? 'success' : 'warning'
                "
              >
                {{
                  latestRegisterResult.labelPrintSuccess ? '成功' : '存在失败'
                }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="结果消息" :span="2">
              {{ formatNullable(latestRegisterResult.labelPrintMessage) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElTable :data="latestRegisterResult.specimens" border class="mt-4">
            <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
            <ElTableColumn label="条码" min-width="180" prop="barcode" />
            <ElTableColumn
              label="标本名称"
              min-width="160"
              prop="specimenName"
            />
            <ElTableColumn label="状态" min-width="120" prop="specimenStatus" />
            <ElTableColumn
              label="标签状态"
              min-width="120"
              prop="labelPrintStatus"
            />
            <ElTableColumn label="部位" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.specimenSite) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </template>

        <ElEmpty v-else description="当前申请单暂无登记结果" />
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
