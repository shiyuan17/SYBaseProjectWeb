<script setup lang="ts">
import type {
  ApplicationCreateRequest,
  ApplicationDetailView,
  ImportClinicalApplicationRequest,
  LabelPrintRetryResult,
  SpecimenRegisterItemRequest,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createApplication,
  getApplicationDetail,
  importClinicalApplication,
  registerSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { APPLICATION_TYPE_OPTIONS, M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDate, formatDateTime, formatNullable } from '../utils/format';

type RegisterRow = SpecimenRegisterItemRequest & {
  key: number;
};

const accessStore = useAccessStore();
const userStore = useUserStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canCreateApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_CREATE),
);
const canQueryApplicationDetail = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);
const canImportClinicalApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
);

const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

const pageError = ref('');
const applicationIdInput = ref('');
const currentApplicationId = ref('');
const applicationDetail = ref<null | ApplicationDetailView>(null);
const registerResult = ref<null | SpecimenRegisterResult>(null);
const retryResult = ref<LabelPrintRetryResult | null>(null);

const loadingDetail = ref(false);
const creatingApplication = ref(false);
const importingClinicalApplication = ref(false);
const submittingRegister = ref(false);
const retryingLabelPrint = ref(false);

const createForm = reactive<ApplicationCreateRequest>({
  applicationDate: null,
  applicationNo: null,
  applicationType: 'ROUTINE',
  clinicalDiagnosis: '',
  clinicalSymptom: null,
  externalOrderNo: null,
  patientAge: null,
  patientGender: null,
  patientId: null,
  patientName: null,
  remarks: null,
  sourceHospitalId: null,
  sourceHospitalName: null,
  specimenSite: '',
  status: null,
  submissionDate: null,
  submittingDepartmentId: '',
  submittingDepartmentName: '',
  submittingDoctorName: currentUserName.value,
  submittingDoctorUserId: currentUserId.value,
  thirdPartySource: null,
});

const registerForm = reactive({
  collectionScene: '',
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const retryForm = reactive({
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const importForm = reactive<ImportClinicalApplicationRequest>({
  externalOrderNo: '',
  thirdPartySource: '',
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

function resetCreateForm() {
  Object.assign(createForm, {
    applicationDate: null,
    applicationNo: null,
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '',
    clinicalSymptom: null,
    externalOrderNo: null,
    patientAge: null,
    patientGender: null,
    patientId: null,
    patientName: null,
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: null,
    specimenSite: '',
    status: null,
    submissionDate: null,
    submittingDepartmentId: '',
    submittingDepartmentName: '',
    submittingDoctorName: currentUserName.value,
    submittingDoctorUserId: currentUserId.value,
    thirdPartySource: null,
  });
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

function resetImportForm() {
  Object.assign(importForm, {
    externalOrderNo: '',
    thirdPartySource: '',
  });
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

function applyApplicationContext(
  applicationId?: string | null,
  options: { preserveResults?: boolean } = {},
) {
  const normalizedId = (applicationId ?? applicationIdInput.value).trim();
  if (!normalizedId) {
    ElMessage.warning('请输入申请单 ID');
    return false;
  }
  const changed = normalizedId !== currentApplicationId.value;
  currentApplicationId.value = normalizedId;
  applicationIdInput.value = normalizedId;
  if (changed && !options.preserveResults) {
    registerResult.value = null;
    retryResult.value = null;
  }
  return true;
}

async function loadApplication() {
  if (!applyApplicationContext(undefined, { preserveResults: true })) {
    return;
  }
  if (!canQueryApplicationDetail.value) {
    ElMessage.warning('当前账号没有申请单详情查询权限');
    return;
  }

  loadingDetail.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(currentApplicationId.value);
    ElMessage.success('申请单详情已加载');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function submitCreateApplication() {
  if (!canCreateApplication.value) {
    return;
  }
  if (!createForm.patientId?.trim() && !createForm.patientName?.trim()) {
    ElMessage.warning('患者 ID 与患者姓名至少填写一项');
    return;
  }
  if (!createForm.submittingDepartmentId.trim()) {
    ElMessage.warning('请填写送检科室 ID');
    return;
  }
  if (!createForm.submittingDepartmentName.trim()) {
    ElMessage.warning('请填写送检科室名称');
    return;
  }
  if (!createForm.submittingDoctorName.trim()) {
    ElMessage.warning('请填写送检医生');
    return;
  }
  if (!createForm.submittingDoctorUserId.trim()) {
    ElMessage.warning('请填写送检医生用户 ID');
    return;
  }
  if (!createForm.clinicalDiagnosis.trim()) {
    ElMessage.warning('请填写临床诊断');
    return;
  }
  if (!createForm.specimenSite.trim()) {
    ElMessage.warning('请填写送检部位');
    return;
  }

  creatingApplication.value = true;
  pageError.value = '';
  try {
    const result = await createApplication({
      ...createForm,
      patientAge: createForm.patientAge?.trim() || null,
      patientGender: createForm.patientGender?.trim() || null,
      patientId: createForm.patientId?.trim() || null,
      patientName: createForm.patientName?.trim() || null,
      remarks: createForm.remarks?.trim() || null,
      sourceHospitalId: createForm.sourceHospitalId?.trim() || null,
      sourceHospitalName: createForm.sourceHospitalName?.trim() || null,
      submittingDoctorName: createForm.submittingDoctorName.trim(),
      submittingDoctorUserId: createForm.submittingDoctorUserId.trim(),
    });
    resetCreateForm();
    applicationDetail.value = null;
    applyApplicationContext(result.id);
    ElMessage.success('申请单创建成功，已切换到当前上下文');
    if (canQueryApplicationDetail.value) {
      await loadApplication();
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    creatingApplication.value = false;
  }
}

async function submitImportClinicalApplication() {
  if (!canImportClinicalApplication.value) {
    return;
  }
  if (!importForm.thirdPartySource.trim()) {
    ElMessage.warning('请填写第三方来源编码');
    return;
  }
  if (!importForm.externalOrderNo.trim()) {
    ElMessage.warning('请填写外部申请单号');
    return;
  }

  importingClinicalApplication.value = true;
  pageError.value = '';
  try {
    const result = await importClinicalApplication({
      externalOrderNo: importForm.externalOrderNo.trim(),
      thirdPartySource: importForm.thirdPartySource.trim(),
    });
    resetImportForm();
    applicationDetail.value = null;
    applyApplicationContext(result.id);
    ElMessage.success('临床申请导入成功，已切换到当前上下文');
    if (canQueryApplicationDetail.value) {
      await loadApplication();
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    importingClinicalApplication.value = false;
  }
}

async function submitRegister() {
  if (!applyApplicationContext(currentApplicationId.value)) {
    return;
  }
  if (!registerForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人');
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
    registerResult.value = await registerSpecimens({
      applicationId: currentApplicationId.value,
      collectionScene: registerForm.collectionScene.trim() || null,
      items,
      operatorName: registerForm.operatorName.trim(),
      operatorUserId: registerForm.operatorUserId.trim() || null,
      printerCode: registerForm.printerCode.trim() || null,
      remarks: registerForm.remarks.trim() || null,
      terminalCode: registerForm.terminalCode.trim() || null,
    });
    retryResult.value = null;
    ElMessage.success('标本登记成功');
    resetRegisterForm();
    if (canQueryApplicationDetail.value) {
      await loadApplication();
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submittingRegister.value = false;
  }
}

async function submitRetryLabelPrint() {
  const batchNo = registerResult.value?.labelPrintBatchNo?.trim();
  if (!batchNo) {
    ElMessage.warning('当前没有可补打的标签批次');
    return;
  }
  if (!retryForm.operatorName.trim()) {
    ElMessage.warning('请填写补打操作人');
    return;
  }
  if (!retryForm.printerCode.trim()) {
    ElMessage.warning('请填写打印机编码');
    return;
  }

  retryingLabelPrint.value = true;
  pageError.value = '';
  try {
    retryResult.value = await retryLabelPrint(batchNo, {
      operatorName: retryForm.operatorName.trim(),
      operatorUserId: retryForm.operatorUserId.trim() || null,
      printerCode: retryForm.printerCode.trim(),
      remarks: retryForm.remarks.trim() || null,
      terminalCode: retryForm.terminalCode.trim() || null,
    });
    ElMessage.success('标签补打请求已提交');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retryingLabelPrint.value = false;
  }
}

const hasApplicationContext = computed(() => Boolean(currentApplicationId.value));
const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);
</script>

<template>
  <Page
    title="临床登记"
    description="按已知 applicationId 执行临床送检登记，可按权限补充申请单创建、详情加载与标签补打。"
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
        title="工作上下文"
        description="首期登记站以已知申请单 ID 进入；若无详情权限，页面不会主动绕权查询申请单。"
      >
        <ElForm inline label-width="96px">
          <ElFormItem label="申请单 ID">
            <ElInput
              v-model="applicationIdInput"
              clearable
              placeholder="请输入 applicationId"
              style="width: 320px"
              @keyup.enter="applyApplicationContext()"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="applyApplicationContext()">
              设为当前上下文
            </ElButton>
            <ElButton
              v-if="canQueryApplicationDetail"
              :loading="loadingDetail"
              @click="loadApplication"
            >
              拉取申请单详情
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="当前申请单">
            {{ hasApplicationContext ? currentApplicationId : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatNullable(applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(applicationDetail?.applicationNo) }}
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

        <ElAlert
          v-if="!canQueryApplicationDetail"
          class="mt-4"
          :closable="false"
          title="当前账号没有申请单详情查询权限，登记将仅基于已知 applicationId 执行。"
          type="info"
          show-icon
        />
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="canImportClinicalApplication"
        title="第三方申请导入"
        description="对接临床系统导入接口，按来源编码与外部申请单号生成院内申请单，并自动切换为当前登记上下文。"
      >
        <ElForm inline label-width="112px">
          <ElFormItem label="第三方来源" required>
            <ElInput
              v-model="importForm.thirdPartySource"
              clearable
              placeholder="例如：HIS、EMR"
              style="width: 220px"
              @keyup.enter="submitImportClinicalApplication"
            />
          </ElFormItem>
          <ElFormItem label="外部申请单号" required>
            <ElInput
              v-model="importForm.externalOrderNo"
              clearable
              placeholder="请输入外部申请单号"
              style="width: 280px"
              @keyup.enter="submitImportClinicalApplication"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton @click="resetImportForm">重置</ElButton>
            <ElButton
              :loading="importingClinicalApplication"
              type="primary"
              @click="submitImportClinicalApplication"
            >
              导入申请
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="canCreateApplication"
        title="申请单创建"
        description="仅对具备 PERM_APPLICATION_CREATE 的角色开放，创建成功后自动切换为当前上下文。"
      >
        <ElForm label-width="110px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="申请类型" required>
              <ElSelect v-model="createForm.applicationType" placeholder="请选择申请类型">
                <ElOption
                  v-for="option in APPLICATION_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="申请单号">
              <ElInput v-model="createForm.applicationNo" placeholder="留空时由后端生成" />
            </ElFormItem>
            <ElFormItem label="患者 ID">
              <ElInput v-model="createForm.patientId" placeholder="患者 ID / 门诊号 / 住院号" />
            </ElFormItem>
            <ElFormItem label="患者姓名">
              <ElInput v-model="createForm.patientName" placeholder="请输入患者姓名" />
            </ElFormItem>
            <ElFormItem label="患者性别">
              <ElInput v-model="createForm.patientGender" placeholder="例如：男 / 女" />
            </ElFormItem>
            <ElFormItem label="患者年龄">
              <ElInput v-model="createForm.patientAge" placeholder="例如：45 岁" />
            </ElFormItem>
            <ElFormItem label="送检科室 ID" required>
              <ElInput
                v-model="createForm.submittingDepartmentId"
                placeholder="请输入送检科室 ID"
              />
            </ElFormItem>
            <ElFormItem label="送检科室名称" required>
              <ElInput
                v-model="createForm.submittingDepartmentName"
                placeholder="请输入送检科室名称"
              />
            </ElFormItem>
            <ElFormItem label="送检医生 ID" required>
              <ElInput
                v-model="createForm.submittingDoctorUserId"
                placeholder="请输入送检医生用户 ID"
              />
            </ElFormItem>
            <ElFormItem label="送检医生" required>
              <ElInput
                v-model="createForm.submittingDoctorName"
                placeholder="请输入送检医生姓名"
              />
            </ElFormItem>
            <ElFormItem label="送检部位" required>
              <ElInput v-model="createForm.specimenSite" placeholder="例如：胃窦、甲状腺左叶" />
            </ElFormItem>
            <ElFormItem label="外部单号">
              <ElInput v-model="createForm.externalOrderNo" placeholder="第三方或HIS单号" />
            </ElFormItem>
          </div>
          <ElFormItem label="临床诊断" required>
            <ElInput
              v-model="createForm.clinicalDiagnosis"
              :rows="3"
              placeholder="请输入临床诊断"
              type="textarea"
            />
          </ElFormItem>
          <ElFormItem label="临床症状">
            <ElInput
              v-model="createForm.clinicalSymptom"
              :rows="2"
              placeholder="请输入临床症状"
              type="textarea"
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="createForm.remarks"
              :rows="2"
              placeholder="补充信息"
              type="textarea"
            />
          </ElFormItem>
          <div class="flex justify-end gap-2">
            <ElButton @click="resetCreateForm">重置</ElButton>
            <ElButton :loading="creatingApplication" type="primary" @click="submitCreateApplication">
              创建申请单
            </ElButton>
          </div>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="标本登记"
        description="支持多标本行录入、打印终端信息与登记结果回显。"
      >
        <ElAlert
          v-if="!hasApplicationContext"
          :closable="false"
          title="请先在上方输入并确认当前申请单 ID。"
          type="warning"
          show-icon
        />

        <template v-else>
          <ElForm label-width="104px">
            <div class="grid gap-4 md:grid-cols-2">
              <ElFormItem label="操作人" required>
                <ElInput v-model="registerForm.operatorName" placeholder="请输入操作人姓名" />
              </ElFormItem>
              <ElFormItem label="操作人 ID">
                <ElInput v-model="registerForm.operatorUserId" placeholder="请输入操作人用户 ID" />
              </ElFormItem>
              <ElFormItem label="打印机编码">
                <ElInput v-model="registerForm.printerCode" placeholder="用于标签打印" />
              </ElFormItem>
              <ElFormItem label="终端编码">
                <ElInput v-model="registerForm.terminalCode" placeholder="扫码枪 / 工作站终端" />
              </ElFormItem>
              <ElFormItem label="采集场景">
                <ElInput v-model="registerForm.collectionScene" placeholder="例如：门诊、病房、手术室" />
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

          <div class="mb-3 flex justify-between gap-2">
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
                <ElInput v-model="row.specimenType" placeholder="类型" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本部位" min-width="140">
              <template #default="{ row }">
                <ElInput v-model="row.specimenSite" placeholder="部位" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="采集方式" min-width="140">
              <template #default="{ row }">
                <ElInput v-model="row.collectionMode" placeholder="采集方式" />
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
                <ElInput v-model="row.clinicalSymptom" placeholder="临床症状" />
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
        </template>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="registerResult"
        title="登记结果"
        description="展示本次标签打印结果、批次号与已登记标本摘要。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="标签批次号">
            {{ registerResult.labelPrintBatchNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="打印结果">
            <ElTag :type="registerResult.labelPrintSuccess ? 'success' : 'warning'">
              {{ registerResult.labelPrintSuccess ? '成功' : '存在失败' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="结果消息" :span="2">
            {{ formatNullable(registerResult.labelPrintMessage) }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElTable :data="registerResult.specimens" border class="mt-4">
          <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
          <ElTableColumn label="条码" min-width="180" prop="barcode" />
          <ElTableColumn label="标本名称" min-width="160" prop="specimenName" />
          <ElTableColumn label="状态" min-width="120" prop="specimenStatus" />
          <ElTableColumn label="标签状态" min-width="120" prop="labelPrintStatus" />
          <ElTableColumn label="部位" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.specimenSite) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="registerResult"
        title="标签补打"
        description="对接标签批次补打接口，按批次重新发起打印。"
      >
        <ElForm inline label-width="96px">
          <ElFormItem label="操作人" required>
            <ElInput v-model="retryForm.operatorName" placeholder="操作人姓名" />
          </ElFormItem>
          <ElFormItem label="操作人 ID">
            <ElInput v-model="retryForm.operatorUserId" placeholder="操作人 ID" />
          </ElFormItem>
          <ElFormItem label="打印机编码" required>
            <ElInput v-model="retryForm.printerCode" placeholder="请输入打印机编码" />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="retryForm.terminalCode" placeholder="终端编码" />
          </ElFormItem>
        </ElForm>
        <ElForm label-width="96px">
          <ElFormItem label="备注">
            <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
          </ElFormItem>
        </ElForm>

        <div class="flex justify-end">
          <ElButton :loading="retryingLabelPrint" type="primary" @click="submitRetryLabelPrint">
            发起补打
          </ElButton>
        </div>

        <ElDescriptions v-if="retryResult" :column="2" border class="mt-4">
          <ElDescriptionsItem label="批次号">
            {{ retryResult.labelPrintBatchNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="整体结果">
            <ElTag :type="retryResult.allSuccessful ? 'success' : 'warning'">
              {{ retryResult.allSuccessful ? '全部成功' : '部分成功' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="成功数">
            {{ retryResult.successCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败数">
            {{ retryResult.failedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="重试数">
            {{ retryResult.retriedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="消息">
            {{ formatNullable(retryResult.message) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="applicationDetail && canQueryApplicationDetail"
        title="申请单详情摘要"
        description="登记环节仅展示当前上下文的关键信息，便于联调核对。"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="申请单号">
            {{ applicationDetail.applicationNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请类型">
            {{ formatNullable(applicationDetail.applicationType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请日期">
            {{ formatDate(applicationDetail.applicationDate) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检日期">
            {{ formatDate(applicationDetail.submissionDate) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者信息">
            {{ formatNullable(applicationDetail.patientName) }} /
            {{ formatNullable(applicationDetail.patientGender) }} /
            {{ formatNullable(applicationDetail.patientAge) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatNullable(applicationDetail.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="临床诊断" :span="2">
            {{ formatNullable(applicationDetail.clinicalDiagnosis) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="临床症状" :span="2">
            {{ formatNullable(applicationDetail.clinicalSymptom) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ formatDateTime(applicationDetail.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ formatDateTime(applicationDetail.updatedAt) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
