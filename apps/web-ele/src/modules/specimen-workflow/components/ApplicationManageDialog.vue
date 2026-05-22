<script setup lang="ts">
import type {
  ApplicationCreateRequest,
  ImportClinicalApplicationRequest,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

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
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import BodyPartSelect from '#/modules/system-management/components/BodyPartSelect.vue';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';
import { GENDER_OPTIONS } from '#/modules/system-management/constants';

import {
  createApplication,
  importClinicalApplication,
} from '../api/specimen-workflow-service';
import {
  APPLICATION_TYPE_OPTIONS,
  M2_PERMISSION_CODES,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

type DialogTabName = 'create' | 'import';
type SubmitMode = 'save' | 'save-and-manage';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  submitted: [{ applicationId: string; mode: SubmitMode }];
  'update:modelValue': [boolean];
}>();

const accessStore = useAccessStore();
const userStore = useUserStore();

const CREATE_TAB: DialogTabName = 'create';
const IMPORT_TAB: DialogTabName = 'import';

const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');
const accessCodeSet = computed(() => new Set(accessStore.accessCodes));

const canCreateApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_CREATE),
);
const canImportClinicalApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
);
const hasManageCapability = computed(
  () => canCreateApplication.value || canImportClinicalApplication.value,
);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const pageError = ref('');
const activeTab = ref<DialogTabName>(CREATE_TAB);
const creatingApplication = ref(false);
const importingClinicalApplication = ref(false);

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

const importForm = reactive<ImportClinicalApplicationRequest>({
  externalOrderNo: '',
  thirdPartySource: '',
});

function getInitialTab() {
  if (canCreateApplication.value) {
    return CREATE_TAB;
  }
  return IMPORT_TAB;
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

function resetImportForm() {
  Object.assign(importForm, {
    externalOrderNo: '',
    thirdPartySource: '',
  });
}

function resetDialogState() {
  pageError.value = '';
  activeTab.value = getInitialTab();
  resetCreateForm();
  resetImportForm();
}

function closeDialog() {
  dialogVisible.value = false;
}

function handleSubmittingDepartmentChange(department: null | { id: string; name: string }) {
  createForm.submittingDepartmentId = department?.id ?? '';
  createForm.submittingDepartmentName = department?.name ?? '';
}

function handleSubmittingDoctorChange(user: null | { id: string; name: string }) {
  createForm.submittingDoctorUserId = user?.id ?? '';
  createForm.submittingDoctorName = user?.name ?? '';
}

async function handleSubmitSuccess(applicationId: string, mode: SubmitMode) {
  closeDialog();
  emit('submitted', { applicationId, mode });
}

async function submitCreateApplication(mode: SubmitMode) {
  if (!canCreateApplication.value) {
    return;
  }
  if (!createForm.patientId?.trim() && !createForm.patientName?.trim()) {
    ElMessage.warning('患者编号与患者姓名至少填写一项');
    return;
  }
  if (!createForm.submittingDepartmentId.trim()) {
    ElMessage.warning('请选择送检科室');
    return;
  }
  if (!createForm.submittingDoctorName.trim()) {
    ElMessage.warning('请选择送检医生');
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
    ElMessage.success(
      mode === 'save' ? '申请单创建成功' : '申请单创建成功，正在前往标本管理',
    );
    await handleSubmitSuccess(result.id, mode);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    creatingApplication.value = false;
  }
}

async function submitImportClinicalApplication(mode: SubmitMode) {
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
    ElMessage.success(
      mode === 'save' ? '临床申请导入成功' : '临床申请导入成功，正在前往标本管理',
    );
    await handleSubmitSuccess(result.id, mode);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    importingClinicalApplication.value = false;
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDialogState();
      return;
    }
    if (!creatingApplication.value && !importingClinicalApplication.value) {
      resetDialogState();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="申请单详情"
    width="960px"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElTabs
        v-if="hasManageCapability"
        v-model="activeTab"
        class="min-h-[480px]"
      >
        <ElTabPane
          v-if="canCreateApplication"
          :name="CREATE_TAB"
          label="手工创建"
        >
          <WorkflowSectionCard
            title="手工创建申请单"
            description="创建成功后可直接留在申请管理，也可继续进入标本管理。"
          >
            <ElForm label-width="110px">
              <div class="grid gap-4 md:grid-cols-2">
                <ElFormItem label="申请类型" required>
                  <ElSelect
                    v-model="createForm.applicationType"
                    placeholder="请选择申请类型"
                  >
                    <ElOption
                      v-for="option in APPLICATION_TYPE_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="申请单号">
                  <ElInput
                    v-model="createForm.applicationNo"
                    placeholder="留空时由后端生成"
                  />
                </ElFormItem>
                <ElFormItem label="患者编号">
                  <ElInput
                    v-model="createForm.patientId"
                    placeholder="患者编号 / 门诊号 / 住院号"
                  />
                </ElFormItem>
                <ElFormItem label="患者姓名">
                  <ElInput
                    v-model="createForm.patientName"
                    placeholder="请输入患者姓名"
                  />
                </ElFormItem>
                <ElFormItem label="患者性别">
                  <ElSelect
                    v-model="createForm.patientGender"
                    clearable
                    placeholder="请选择患者性别"
                  >
                    <ElOption
                      v-for="option in GENDER_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="患者年龄">
                  <ElInput
                    v-model="createForm.patientAge"
                    placeholder="例如：45 岁"
                  />
                </ElFormItem>
                <ElFormItem label="送检科室" required>
                  <DepartmentSelect
                    v-model="createForm.submittingDepartmentId"
                    :selected-label="createForm.submittingDepartmentName"
                    placeholder="请选择送检科室"
                    @change="handleSubmittingDepartmentChange"
                  />
                </ElFormItem>
                <ElFormItem label="送检医生" required>
                  <SystemUserSelect
                    v-model="createForm.submittingDoctorUserId"
                    :selected-label="createForm.submittingDoctorName"
                    placeholder="请选择送检医生"
                    @change="handleSubmittingDoctorChange"
                  />
                </ElFormItem>
                <ElFormItem label="送检部位" required>
                  <BodyPartSelect
                    v-model="createForm.specimenSite"
                    placeholder="例如：胃窦、甲状腺左叶"
                  />
                </ElFormItem>
                <ElFormItem label="外部单号">
                  <ElInput
                    v-model="createForm.externalOrderNo"
                    placeholder="第三方来源单号"
                  />
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
            </ElForm>
          </WorkflowSectionCard>
        </ElTabPane>

        <ElTabPane
          v-if="canImportClinicalApplication"
          :name="IMPORT_TAB"
          label="第三方导入"
        >
          <WorkflowSectionCard
            title="第三方申请导入"
            description="按来源编码和外部申请单号导入，成功后可继续进入标本管理。"
          >
            <ElForm label-width="112px">
              <ElFormItem label="第三方来源" required>
                <ElInput
                  v-model="importForm.thirdPartySource"
                  clearable
                  placeholder="例如：院内系统、门诊系统"
                />
              </ElFormItem>
              <ElFormItem label="外部申请单号" required>
                <ElInput
                  v-model="importForm.externalOrderNo"
                  clearable
                  placeholder="请输入外部申请单号"
                />
              </ElFormItem>
            </ElForm>
          </WorkflowSectionCard>
        </ElTabPane>
      </ElTabs>

      <ElEmpty
        v-else
        description="当前账号没有申请单创建或导入权限"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="closeDialog">取消</ElButton>
        <template v-if="activeTab === CREATE_TAB && canCreateApplication">
          <ElButton @click="resetCreateForm">重置</ElButton>
          <ElButton
            :loading="creatingApplication"
            type="primary"
            @click="submitCreateApplication('save')"
          >
            保存
          </ElButton>
          <ElButton
            :loading="creatingApplication"
            type="primary"
            @click="submitCreateApplication('save-and-manage')"
          >
            保存并前往标本管理
          </ElButton>
        </template>
        <template v-else-if="activeTab === IMPORT_TAB && canImportClinicalApplication">
          <ElButton @click="resetImportForm">重置</ElButton>
          <ElButton
            :loading="importingClinicalApplication"
            type="primary"
            @click="submitImportClinicalApplication('save')"
          >
            保存
          </ElButton>
          <ElButton
            :loading="importingClinicalApplication"
            type="primary"
            @click="submitImportClinicalApplication('save-and-manage')"
          >
            保存并前往标本管理
          </ElButton>
        </template>
      </div>
    </template>
  </ElDialog>
</template>
