<script setup lang="ts">
import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterItemRequest,
  SpecimenRegisterResult,
  SpecimenTrackingSummary,
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
  getLatestRegistrationResult,
  registerSpecimens,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCurrentNode,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
} from '../utils/format';
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';

type RegisterRow = SpecimenRegisterItemRequest & {
  key: number;
};

type RegisterFormState = {
  collectionScene: string;
  operatorName: string;
  operatorUserId: string;
  printerCode: string;
  remarks: string;
  terminalCode: string;
};

type RegisterRowSeed = Omit<RegisterRow, 'key'>;

type RegisterFormSnapshot = RegisterFormState & {
  items: RegisterRowSeed[];
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
const canQueryWorkflowReference = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.WORKFLOW_REFERENCE_QUERY),
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
const loadingLatestRegistration = ref(false);
const pageError = ref('');
const submittingRegister = ref(false);
const latestRegistrationResult = ref<LatestSpecimenRegistrationResult | null>(null);
const initialRegisterSnapshot = ref<null | RegisterFormSnapshot>(null);
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

const registerForm = reactive(createDefaultRegisterFormState());

const registerItems = ref<RegisterRow[]>([createRegisterRow()]);

function createDefaultRegisterFormState(): RegisterFormState {
  return {
    collectionScene: '',
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  };
}

function createEmptyRegisterRowSeed(): RegisterRowSeed {
  return {
    barcode: '',
    clinicalSymptom: '',
    collectionMode: '',
    containerCount: 1,
    containerName: '',
    specimenCount: 1,
    specimenNameStandardized: '',
    specimenSite: '',
    specimenType: '',
  };
}

function createRegisterRow(seed?: Partial<RegisterRowSeed>): RegisterRow {
  return {
    ...createEmptyRegisterRowSeed(),
    ...seed,
    key: Date.now() + Math.floor(Math.random() * 1000),
  };
}

function mapSpecimenToRegisterRowSeed(specimen: SpecimenTrackingSummary): RegisterRowSeed {
  return {
    barcode: specimen.barcode ?? '',
    clinicalSymptom: specimen.clinicalSymptom ?? '',
    collectionMode: specimen.collectionMode ?? '',
    containerCount: specimen.containerCount ?? 1,
    containerName: specimen.containerName ?? '',
    specimenCount: specimen.specimenCount ?? 1,
    specimenNameStandardized: specimen.specimenName ?? '',
    specimenSite: specimen.specimenSite ?? '',
    specimenType: specimen.specimenType ?? '',
  };
}

function buildRegisterFormSnapshot(
  result: LatestSpecimenRegistrationResult | null,
): null | RegisterFormSnapshot {
  if (!result) {
    return null;
  }

  const itemSeeds = result.specimens.map(mapSpecimenToRegisterRowSeed);
  const snapshot = result.registrationSnapshot;
  if (!snapshot && itemSeeds.length === 0) {
    return null;
  }

  return {
    collectionScene: snapshot?.collectionScene ?? '',
    items: itemSeeds.length > 0 ? itemSeeds : [createEmptyRegisterRowSeed()],
    operatorName: snapshot?.operatorName ?? currentUserName.value,
    operatorUserId: snapshot?.operatorUserId ?? currentUserId.value,
    printerCode: snapshot?.printerCode ?? '',
    remarks: snapshot?.remarks ?? '',
    terminalCode: snapshot?.terminalCode ?? '',
  };
}

function applyRegisterFormSnapshot(snapshot?: null | RegisterFormSnapshot) {
  const nextSnapshot = snapshot ?? {
    ...createDefaultRegisterFormState(),
    items: [createEmptyRegisterRowSeed()],
  };

  Object.assign(registerForm, {
    collectionScene: nextSnapshot.collectionScene,
    operatorName: nextSnapshot.operatorName,
    operatorUserId: nextSnapshot.operatorUserId,
    printerCode: nextSnapshot.printerCode,
    remarks: nextSnapshot.remarks,
    terminalCode: nextSnapshot.terminalCode,
  });
  registerItems.value = nextSnapshot.items.map((item) => createRegisterRow(item));
}

function resetRegisterForm() {
  applyRegisterFormSnapshot(initialRegisterSnapshot.value);
}

function resetDialogState() {
  pageError.value = '';
  applicationDetail.value = null;
  currentApplicationId.value = props.applicationId.trim();
  latestRegistrationResult.value = null;
  initialRegisterSnapshot.value = null;
  applyRegisterFormSnapshot(null);
}

function addRegisterRow(afterKey?: number) {
  const nextRow = createRegisterRow();
  if (!afterKey) {
    registerItems.value.push(nextRow);
    return;
  }

  const targetIndex = registerItems.value.findIndex((item) => item.key === afterKey);
  if (targetIndex === -1) {
    registerItems.value.push(nextRow);
    return;
  }

  registerItems.value.splice(targetIndex + 1, 0, nextRow);
}

function removeRegisterRow(key: number) {
  if (registerItems.value.length === 1) {
    ElMessage.warning('至少保留一行标本登记项');
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

async function loadLatestRegistration(options: { silent?: boolean } = {}) {
  if (!currentApplicationId.value) {
    if (!options.silent) {
      ElMessage.warning('缺少申请单编号');
    }
    return;
  }

  loadingLatestRegistration.value = true;
  pageError.value = '';
  try {
    const result = await getLatestRegistrationResult(currentApplicationId.value);
    latestRegistrationResult.value = result;
    initialRegisterSnapshot.value = buildRegisterFormSnapshot(result);
    resetRegisterForm();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingLatestRegistration.value = false;
  }
}

async function loadWorkflowReferenceOptions() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
    enabled: canQueryWorkflowReference.value,
  });
}

async function refreshDialogContext() {
  await Promise.all([
    loadApplicationDetail(),
    loadLatestRegistration(),
  ]);
}

function validateRegisterItems(items: Array<{
  barcode: null | string;
  clinicalSymptom: null | string;
  collectionMode: null | string;
  containerCount: number;
  containerName: string;
  specimenCount: number;
  specimenNameStandardized: string;
  specimenSite: null | string;
  specimenType: null | string;
}>) {
  if (items.some((item) => !item.specimenNameStandardized)) {
    ElMessage.warning('请完整填写每一行标本名称');
    return false;
  }
  if (items.some((item) => !item.specimenSite)) {
    ElMessage.warning('请完整填写每一行标本部位');
    return false;
  }
  if (items.some((item) => !item.containerName)) {
    ElMessage.warning('请完整填写每一行容器名称');
    return false;
  }
  if (items.some((item) => !item.specimenCount || item.specimenCount < 1)) {
    ElMessage.warning('标本数量必须大于 0');
    return false;
  }
  if (items.some((item) => !item.containerCount || item.containerCount < 1)) {
    ElMessage.warning('容器数量必须大于 0');
    return false;
  }

  const barcodeSet = new Set<string>();
  for (const item of items) {
    if (!item.barcode) {
      continue;
    }
    if (barcodeSet.has(item.barcode)) {
      ElMessage.warning('同一次登记中的条码不能重复');
      return false;
    }
    barcodeSet.add(item.barcode);
  }

  return true;
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
    containerCount: item.containerCount,
    containerName: item.containerName.trim(),
    specimenCount: item.specimenCount,
    specimenNameStandardized: item.specimenNameStandardized.trim(),
    specimenSite: item.specimenSite?.trim() || null,
    specimenType: item.specimenType?.trim() || null,
  }));

  if (!validateRegisterItems(items)) {
    return;
  }

  submittingRegister.value = true;
  pageError.value = '';
  try {
    const registrationSnapshot = {
      collectionScene: registerForm.collectionScene.trim() || null,
      operatorName: registerForm.operatorName.trim() || null,
      operatorUserId: registerForm.operatorUserId.trim() || null,
      printerCode: registerForm.printerCode.trim() || null,
      remarks: registerForm.remarks.trim() || null,
      terminalCode: registerForm.terminalCode.trim() || null,
    };
    const result = await registerSpecimens({
      applicationId: currentApplicationId.value,
      collectionScene: registrationSnapshot.collectionScene,
      items,
      operatorName: registerForm.operatorName.trim(),
      operatorUserId: registrationSnapshot.operatorUserId,
      printerCode: registrationSnapshot.printerCode,
      remarks: registrationSnapshot.remarks,
      terminalCode: registrationSnapshot.terminalCode,
    });
    emit('registered', {
      applicationId: currentApplicationId.value,
      registerResult: result,
    });
    latestRegistrationResult.value = {
      applicationId: currentApplicationId.value,
      labelPrintBatchNo: result.labelPrintBatchNo,
      labelPrintMessage: result.labelPrintMessage,
      labelPrintSuccess: result.labelPrintSuccess,
      registrationSnapshot,
      specimens: result.specimens,
    };
    initialRegisterSnapshot.value = buildRegisterFormSnapshot(latestRegistrationResult.value);
    resetRegisterForm();
    ElMessage.success('标本登记成功');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submittingRegister.value = false;
  }
}

const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);

const loadingContext = computed(
  () => loadingDetail.value || loadingLatestRegistration.value,
);

const abnormalSpecimens = computed(() =>
  buildSpecimenAbnormalDetails(latestRegistrationResult.value?.specimens ?? []),
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
      loadLatestRegistration({ silent: true }),
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
    width="min(1680px, calc(100vw - 32px))"
  >
    <div class="flex max-h-[72vh] flex-col gap-4 overflow-y-auto pr-1">
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
        title="当前账号没有申请单详情查询权限，弹窗中仅展示申请单编号并允许直接登记。"
        type="info"
        show-icon
      />

      <ElAlert
        v-if="abnormalSpecimens.length > 0"
        :closable="false"
        title="最近一次登记存在异常标本，请根据异常原因修正后重新登记。"
        type="warning"
        show-icon
      >
        <template #default>
          <div class="mt-2 flex flex-col gap-2 text-sm">
            <div
              v-for="specimen in abnormalSpecimens"
              :key="`${specimen.id}-${specimen.barcode}`"
              class="rounded border border-warning/30 bg-warning/10 px-3 py-2"
            >
              <div>
                {{ specimen.specimenNo || '-' }} / {{ specimen.barcode || '-' }}
              </div>
              <div class="mt-1 grid gap-1 text-muted-foreground md:grid-cols-2">
                <div>异常类型：{{ formatReceiptStatus(specimen.status) }}</div>
                <div>质控结果：{{ formatQualityCheckResult(specimen.qualityCheckResult) }}</div>
                <div>问题代码：{{ specimen.qualityIssueCodes.length ? specimen.qualityIssueCodes.join('、') : '-' }}</div>
                <div>原因：{{ specimen.reason || '-' }}</div>
              </div>
            </div>
          </div>
        </template>
      </ElAlert>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="text-base font-semibold text-foreground">当前上下文</div>
          <ElButton :loading="loadingContext" @click="refreshDialogContext">
            刷新详情
          </ElButton>
        </div>

        <ElDescriptions :column="2" border>
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
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="登记人" required>
              <ElInput :model-value="registerForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编号">
              <ElInput
                v-model="registerForm.printerCode"
                placeholder="用于标签打印"
              />
            </ElFormItem>
            <ElFormItem label="终端编号">
              <ElInput
                v-model="registerForm.terminalCode"
                placeholder="扫码枪或工作站终端"
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

        <ElTable :data="registerItems" :max-height="360" border>
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
          <ElTableColumn label="标本数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber v-model="row.specimenCount" :min="1" style="width: 100%" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器名称" min-width="160">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.containerName"
                :options="workflowReferenceOptions.containerNames"
                placeholder="请选择或输入容器名称"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber v-model="row.containerCount" :min="1" style="width: 100%" />
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
          <ElTableColumn fixed="right" label="操作" width="140">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <ElButton link type="primary" @click="addRegisterRow(row.key)">
                  新增
                </ElButton>
                <ElButton link type="danger" @click="removeRegisterRow(row.key)">
                  删除
                </ElButton>
              </div>
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
