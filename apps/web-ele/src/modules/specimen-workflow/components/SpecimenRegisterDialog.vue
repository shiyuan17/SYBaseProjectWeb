<script setup lang="ts">
import type {
  ApplicationDetailView,
  SpecimenRegisterItemRequest,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import BodyPartSelect from '#/modules/system-management/components/BodyPartSelect.vue';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import {
  getApplicationDetail,
  registerSpecimens,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCurrentNode,
  formatNullable,
} from '../utils/format';

type RegisterRow = SpecimenRegisterItemRequest & {
  key: number;
};

const props = defineProps<{
  applicationId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  registered: [
    {
      applicationId: string;
      registerResult: SpecimenRegisterResult;
    },
  ];
  'update:modelValue': [boolean];
}>();

const accessStore = useAccessStore();
const userStore = useUserStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canQueryApplicationDetail = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);

const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const applicationDetail = ref<null | ApplicationDetailView>(null);
const currentApplicationId = ref('');
const loadingDetail = ref(false);
const pageError = ref('');
const submittingRegister = ref(false);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

const registerForm = reactive({
  collectionScene: '',
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const registerItems = ref<RegisterRow[]>([createRegisterRow()]);

function createRegisterRow(): RegisterRow {
  return {
    barcode: '',
    clinicalSymptom: '',
    collectionMode: '',
    key: Date.now() + Math.floor(Math.random() * 1000),
    specimenCount: 1,
    specimenNameStandardized: '',
    specimenSite: '',
    specimenType: '',
  };
}

function resetRegisterForm() {
  Object.assign(registerForm, {
    collectionScene: '',
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });
  registerItems.value = [createRegisterRow()];
}

function resetDialogState() {
  pageError.value = '';
  applicationDetail.value = null;
  currentApplicationId.value = props.applicationId.trim();
  resetRegisterForm();
}

function addRegisterRow() {
  registerItems.value.push(createRegisterRow());
}

function removeRegisterRow(key: number) {
  if (registerItems.value.length === 1) {
    ElMessage.warning('至少保留一行标本明细');
    return;
  }
  registerItems.value = registerItems.value.filter((item) => item.key !== key);
}

async function loadApplicationDetail(options: { silent?: boolean } = {}) {
  if (!currentApplicationId.value) {
    if (!options.silent) {
      ElMessage.warning('缺少申请单编号');
    }
    return;
  }
  if (!canQueryApplicationDetail.value) {
    return;
  }

  loadingDetail.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(currentApplicationId.value);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function loadWorkflowReferenceOptions() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely();
}

async function submitRegister() {
  if (!currentApplicationId.value) {
    ElMessage.warning('缺少申请单编号');
    return;
  }
  if (!registerForm.operatorName.trim()) {
    ElMessage.warning('当前登录人信息缺失');
    return;
  }

  const items = registerItems.value.map((item) => ({
    barcode: item.barcode?.trim() || null,
    clinicalSymptom: item.clinicalSymptom?.trim() || null,
    collectionMode: item.collectionMode?.trim() || null,
    specimenCount: item.specimenCount,
    specimenNameStandardized: item.specimenNameStandardized.trim(),
    specimenSite: item.specimenSite?.trim() || null,
    specimenType: item.specimenType?.trim() || null,
  }));

  if (items.some((item) => !item.specimenNameStandardized)) {
    ElMessage.warning('请完整填写每一行标本名称');
    return;
  }
  if (items.some((item) => !item.specimenCount || item.specimenCount < 1)) {
    ElMessage.warning('标本数量必须大于 0');
    return;
  }

  submittingRegister.value = true;
  pageError.value = '';
  try {
    const result = await registerSpecimens({
      applicationId: currentApplicationId.value,
      collectionScene: registerForm.collectionScene.trim() || null,
      items,
      operatorName: registerForm.operatorName.trim(),
      operatorUserId: registerForm.operatorUserId.trim() || null,
      printerCode: registerForm.printerCode.trim() || null,
      remarks: registerForm.remarks.trim() || null,
      terminalCode: registerForm.terminalCode.trim() || null,
    });
    emit('registered', {
      applicationId: currentApplicationId.value,
      registerResult: result,
    });
    resetRegisterForm();
    ElMessage.success('标本登记成功');
    if (canQueryApplicationDetail.value) {
      await loadApplicationDetail({ silent: true });
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submittingRegister.value = false;
  }
}

const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);

function closeDialog() {
  dialogVisible.value = false;
}

watch(
  () => [props.applicationId, props.modelValue],
  async ([, visible]) => {
    if (!visible) {
      return;
    }
    resetDialogState();
    await Promise.all([
      loadApplicationDetail({ silent: true }),
      loadWorkflowReferenceOptions(),
    ]);
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="标本登记"
    top="4vh"
    width="1480px"
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
        title="当前账号没有申请单详情查询权限，弹窗中仅展示当前申请单编号并允许直接登记。"
        type="info"
        show-icon
      />

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-4">
          <div class="text-base font-semibold text-foreground">当前上下文</div>
          <ElButton :loading="loadingDetail" @click="loadApplicationDetail()">
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
        <div class="mb-4 text-base font-semibold text-foreground">登记表单</div>

        <ElForm label-width="104px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="操作人" required>
              <ElInput :model-value="registerForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编码">
              <ElInput
                v-model="registerForm.printerCode"
                placeholder="用于标签打印"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput
                v-model="registerForm.terminalCode"
                placeholder="扫码枪 / 工作站终端"
              />
            </ElFormItem>
            <ElFormItem label="采集场景">
              <ElInput
                v-model="registerForm.collectionScene"
                placeholder="例如：门诊、病房、手术室"
              />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput
              v-model="registerForm.remarks"
              :rows="2"
              placeholder="补充登记说明"
              type="textarea"
            />
          </ElFormItem>
        </ElForm>

        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="text-sm text-muted-foreground">
            当前登记上下文：{{ currentApplicationId }}
          </div>
          <ElButton type="primary" @click="addRegisterRow">新增标本行</ElButton>
        </div>

        <ElTable :data="registerItems" border>
          <ElTableColumn label="标本名称" min-width="180">
            <template #default="{ row }">
              <ElInput
                v-model="row.specimenNameStandardized"
                placeholder="标准化标本名称"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本类型" min-width="140">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.specimenType"
                :options="workflowReferenceOptions.specimenTypes"
                placeholder="请选择或输入类型"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本部位" min-width="140">
            <template #default="{ row }">
              <BodyPartSelect v-model="row.specimenSite" placeholder="部位" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="采集方式" min-width="140">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.collectionMode"
                :options="workflowReferenceOptions.collectionModes"
                placeholder="请选择或输入采集方式"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber v-model="row.specimenCount" :min="1" style="width: 100%" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="条码" min-width="180">
            <template #default="{ row }">
              <ElInput v-model="row.barcode" placeholder="可留空由后端生成" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="临床症状" min-width="180">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.clinicalSymptom"
                :options="workflowReferenceOptions.clinicalSymptoms"
                placeholder="请选择或输入临床症状"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="danger" @click="removeRegisterRow(row.key)">
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end gap-2">
          <ElButton @click="resetRegisterForm">重置登记表单</ElButton>
          <ElButton :loading="submittingRegister" type="primary" @click="submitRegister">
            提交登记
          </ElButton>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
