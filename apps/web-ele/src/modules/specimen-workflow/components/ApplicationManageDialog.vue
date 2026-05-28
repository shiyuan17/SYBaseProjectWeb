<script setup lang="ts">
import type {
  ApplicationCreateRequest,
  ApplicationDetailView,
  ImportClinicalApplicationRequest,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';
import BodyPartSelect from '#/modules/system-management/components/BodyPartSelect.vue';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';
import { GENDER_OPTIONS } from '#/modules/system-management/constants';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
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

import {
  createApplication,
  duplicateCheckApplications,
  getApplicationDetail,
  importClinicalApplication,
  updateApplication,
} from '../api/specimen-workflow-service';
import {
  APPLICATION_FORM_STATUS_OPTIONS,
  APPLICATION_TYPE_OPTIONS,
  M2_PERMISSION_CODES,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

type DialogTabName = 'create' | 'import';
type DialogMode = 'create' | 'edit';
type SubmitMode = 'save' | 'save-and-manage';

const props = withDefaults(
  defineProps<{
    applicationId?: null | string;
    mode?: DialogMode;
    modelValue: boolean;
  }>(),
  {
    applicationId: null,
    mode: 'create',
  },
);

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
const canUpdateApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_UPDATE),
);
const canImportClinicalApplication = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
);
const canQueryWorkflowReference = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.WORKFLOW_REFERENCE_QUERY),
);
const hasManageCapability = computed(
  () => canCreateApplication.value || canImportClinicalApplication.value,
);
const isEditMode = computed(() => props.mode === 'edit');
const canSubmitCreateForm = computed(() =>
  isEditMode.value ? canUpdateApplication.value : canCreateApplication.value,
);
const canShowCreateForm = computed(() => canSubmitCreateForm.value);
const canShowImportTab = computed(() =>
  !isEditMode.value && canImportClinicalApplication.value,
);
const hasDialogCapability = computed(() =>
  isEditMode.value ? canUpdateApplication.value : hasManageCapability.value,
);
const dialogTitle = computed(() =>
  isEditMode.value ? '编辑申请单' : '申请单详情',
);
const createFormTitle = computed(() =>
  isEditMode.value ? '编辑申请单' : '手工创建申请单',
);
const createFormDescription = computed(() =>
  isEditMode.value
    ? '仅允许未进入下游流程的申请单保存修改。'
    : '创建成功后可留在申请列表，也可继续进入标本登记。',
);
const editableApplicationFormStatusOptions = computed(() =>
  APPLICATION_FORM_STATUS_OPTIONS.filter((option) => option.value !== 'VOIDED'),
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
const loadingApplicationDetail = ref(false);
const duplicateChecking = ref(false);
const duplicateCheckMessage = ref('');
const duplicateSuggestedAction = ref('ALLOW');
const duplicateConfirmed = ref(false);
const clinicalSymptomSuggestion = ref('');
const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

const createForm = reactive<ApplicationCreateRequest>({
  applicationDate: null,
  applicationNo: null,
  applicationFormStatus: 'PENDING',
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
  specimenRemovalTime: null,
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
  if (isEditMode.value) {
    return CREATE_TAB;
  }
  if (canCreateApplication.value) {
    return CREATE_TAB;
  }
  return IMPORT_TAB;
}

function resetCreateForm() {
  Object.assign(createForm, {
    applicationDate: null,
    applicationNo: null,
    applicationFormStatus: 'PENDING',
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
    specimenRemovalTime: null,
    status: null,
    submissionDate: null,
    submittingDepartmentId: '',
    submittingDepartmentName: '',
    submittingDoctorName: currentUserName.value,
    submittingDoctorUserId: currentUserId.value,
    thirdPartySource: null,
  });
  clinicalSymptomSuggestion.value = '';
  duplicateCheckMessage.value = '';
  duplicateSuggestedAction.value = 'ALLOW';
  duplicateConfirmed.value = false;
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

function fillCreateForm(detail: ApplicationDetailView) {
  Object.assign(createForm, {
    applicationDate: detail.applicationDate,
    applicationNo: detail.applicationNo,
    applicationFormStatus: detail.applicationFormStatus ?? 'PENDING',
    applicationType: detail.applicationType ?? 'ROUTINE',
    clinicalDiagnosis: detail.clinicalDiagnosis ?? '',
    clinicalSymptom: detail.clinicalSymptom,
    externalOrderNo: detail.externalOrderNo,
    patientAge: detail.patientAge,
    patientGender: detail.patientGender,
    patientId: detail.patientId,
    patientName: detail.patientName,
    remarks: detail.remarks,
    sourceHospitalId: detail.sourceHospitalId,
    sourceHospitalName: detail.sourceHospitalName,
    specimenSite: detail.specimenSite ?? '',
    specimenRemovalTime: detail.specimenRemovalTime,
    status: detail.status,
    submissionDate: detail.submissionDate,
    submittingDepartmentId: detail.submittingDepartmentId ?? '',
    submittingDepartmentName: detail.submittingDepartmentName ?? '',
    submittingDoctorName: detail.submittingDoctorName ?? '',
    submittingDoctorUserId: detail.submittingDoctorUserId ?? '',
    thirdPartySource: detail.thirdPartySource,
  });
  clinicalSymptomSuggestion.value = detail.clinicalSymptom ?? '';
}

async function loadApplicationForEdit() {
  if (!isEditMode.value || !props.applicationId) {
    return;
  }
  loadingApplicationDetail.value = true;
  pageError.value = '';
  try {
    fillCreateForm(await getApplicationDetail(props.applicationId));
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingApplicationDetail.value = false;
  }
}

async function loadWorkflowReferenceOptions() {
  workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
    enabled: canQueryWorkflowReference.value,
  });
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

function handleClinicalSymptomSuggestionChange(value: string) {
  clinicalSymptomSuggestion.value = value;
  createForm.clinicalSymptom = value || null;
}

function confirmDuplicateWarning() {
  duplicateConfirmed.value = true;
  ElMessage.success('已确认疑似重复申请，保存时将继续提交');
}

function trimOrNull(value?: null | string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function handleDuplicateCheck() {
  if (!trimOrNull(createForm.patientId) && !trimOrNull(createForm.patientName)) {
    ElMessage.warning('请先填写患者编号或患者姓名');
    return false;
  }
  if (!trimOrNull(createForm.externalOrderNo) && !trimOrNull(createForm.applicationDate)) {
    ElMessage.warning('请至少填写外部单号或申请日期');
    return false;
  }

  duplicateChecking.value = true;
  pageError.value = '';
  duplicateConfirmed.value = false;
  try {
    const result = await duplicateCheckApplications({
      applicationDate: trimOrNull(createForm.applicationDate),
      applicationType: trimOrNull(createForm.applicationType),
      externalOrderNo: trimOrNull(createForm.externalOrderNo),
      patientId: trimOrNull(createForm.patientId),
      patientName: trimOrNull(createForm.patientName),
      specimenSite: trimOrNull(createForm.specimenSite),
    });
    const duplicateItems = isEditMode.value
      ? result.items.filter((item) => item.id !== props.applicationId)
      : result.items;
    duplicateSuggestedAction.value = duplicateItems.length === 0
      ? 'ALLOW'
      : duplicateItems.length === 1 ? 'CONFIRM' : result.suggestedAction;
    if (duplicateItems.length === 0) {
      duplicateCheckMessage.value = '未发现疑似重复申请';
      duplicateConfirmed.value = true;
      ElMessage.success(duplicateCheckMessage.value);
      return true;
    }
    duplicateCheckMessage.value =
      duplicateSuggestedAction.value === 'BLOCK'
        ? '命中强拦截级重复申请，请核对后停止创建或调整申请信息'
        : `发现 ${duplicateItems.length} 条疑似重复申请，确认无误后可继续保存`;
    if (duplicateSuggestedAction.value === 'BLOCK') {
      ElMessage.warning(duplicateCheckMessage.value);
      return false;
    }
    ElMessage.info(duplicateCheckMessage.value);
    return false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    return false;
  } finally {
    duplicateChecking.value = false;
  }
}

async function handleSubmitSuccess(applicationId: string, mode: SubmitMode) {
  closeDialog();
  emit('submitted', { applicationId, mode });
}

async function submitCreateApplication(mode: SubmitMode) {
  if (!canSubmitCreateForm.value) {
    return;
  }
  if (!createForm.patientId?.trim() && !createForm.patientName?.trim()) {
    ElMessage.warning('患者编号与患者姓名至少填写一项');
    return;
  }
  if (!createForm.applicationDate?.trim()) {
    ElMessage.warning('请选择申请日期');
    return;
  }
  if (!createForm.submissionDate?.trim()) {
    ElMessage.warning('请选择送检日期');
    return;
  }
  if (!createForm.sourceHospitalName?.trim()) {
    ElMessage.warning('请填写来源医院');
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
  if (!createForm.specimenRemovalTime?.trim()) {
    ElMessage.warning('请选择标本离体时间');
    return;
  }
  if (!duplicateConfirmed.value) {
    const duplicatePassed = await handleDuplicateCheck();
    if (!duplicatePassed) {
      return;
    }
  }

  creatingApplication.value = true;
  pageError.value = '';
  try {
    const payload = {
      ...createForm,
      patientAge: createForm.patientAge?.trim() || null,
      patientGender: createForm.patientGender?.trim() || null,
      patientId: createForm.patientId?.trim() || null,
      patientName: createForm.patientName?.trim() || null,
      remarks: createForm.remarks?.trim() || null,
      sourceHospitalId: createForm.sourceHospitalId?.trim() || null,
      sourceHospitalName: createForm.sourceHospitalName?.trim() || null,
      specimenRemovalTime: createForm.specimenRemovalTime?.trim() || null,
      submittingDoctorName: createForm.submittingDoctorName.trim(),
      submittingDoctorUserId: createForm.submittingDoctorUserId.trim(),
    };
    const result = isEditMode.value && props.applicationId
      ? await updateApplication(props.applicationId, payload)
      : await createApplication(payload);
    ElMessage.success(
      isEditMode.value
        ? '申请单更新成功'
        : mode === 'save' ? '申请单创建成功' : '申请单创建成功，正在前往标本登记',
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
      mode === 'save' ? '临床申请导入成功' : '临床申请导入成功，正在前往标本登记',
    );
    await handleSubmitSuccess(result.id, mode);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    importingClinicalApplication.value = false;
  }
}

watch(
  () => [
    createForm.patientId,
    createForm.patientName,
    createForm.externalOrderNo,
    createForm.applicationDate,
    createForm.applicationType,
    createForm.specimenSite,
  ],
  () => {
    if (duplicateCheckMessage.value || duplicateConfirmed.value) {
      duplicateCheckMessage.value = '';
      duplicateSuggestedAction.value = 'ALLOW';
      duplicateConfirmed.value = false;
    }
  },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDialogState();
      void loadWorkflowReferenceOptions();
      void loadApplicationForEdit();
      return;
    }
    if (!creatingApplication.value && !importingClinicalApplication.value && !loadingApplicationDetail.value) {
      resetDialogState();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    :title="dialogTitle"
    width="960px"
  >
    <div v-loading="loadingApplicationDetail" class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElTabs
        v-if="hasDialogCapability"
        v-model="activeTab"
        class="min-h-[480px]"
      >
        <ElTabPane
          v-if="canShowCreateForm"
          :name="CREATE_TAB"
          :label="isEditMode ? '编辑' : '手工创建'"
        >
          <WorkflowSectionCard
            :title="createFormTitle"
            :description="createFormDescription"
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
                <ElFormItem label="申请日期" required>
                  <ElDatePicker
                    v-model="createForm.applicationDate"
                    placeholder="请选择申请日期"
                    type="date"
                    value-format="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem label="送检日期" required>
                  <ElDatePicker
                    v-model="createForm.submissionDate"
                    placeholder="请选择送检日期"
                    type="date"
                    value-format="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem label="离体时间" required>
                  <ElDatePicker
                    v-model="createForm.specimenRemovalTime"
                    placeholder="请选择标本离体时间"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                  />
                </ElFormItem>
                <ElFormItem label="申请单随附">
                  <ElSelect v-model="createForm.applicationFormStatus" placeholder="请选择随附状态">
                    <ElOption
                      v-for="option in editableApplicationFormStatusOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="来源医院" required>
                  <ElInput
                    v-model="createForm.sourceHospitalName"
                    placeholder="请输入来源医院"
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
              <ElAlert
                v-if="duplicateCheckMessage"
                :closable="false"
                :title="duplicateCheckMessage"
                :type="duplicateSuggestedAction === 'BLOCK' ? 'warning' : 'info'"
                class="mb-4"
                show-icon
              />
              <div
                v-if="duplicateCheckMessage && duplicateSuggestedAction === 'CONFIRM'"
                class="mb-4 flex justify-end"
              >
                <ElButton type="primary" @click="confirmDuplicateWarning">
                  确认继续保存
                </ElButton>
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
                <ReferenceOptionSelect
                  :model-value="clinicalSymptomSuggestion"
                  :options="workflowReferenceOptions.clinicalSymptoms"
                  placeholder="可先选建议项，再继续补充"
                  @update:model-value="handleClinicalSymptomSuggestionChange"
                />
              </ElFormItem>
              <ElFormItem label="症状说明">
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
          v-if="canShowImportTab"
          :name="IMPORT_TAB"
          label="第三方导入"
        >
          <WorkflowSectionCard
            title="第三方申请导入"
            description="按来源编码和外部申请单号导入，成功后可继续进入标本登记。"
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
        :description="isEditMode ? '当前账号没有申请单编辑权限' : '当前账号没有申请单创建或导入权限'"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="closeDialog">取消</ElButton>
        <template v-if="activeTab === CREATE_TAB && canSubmitCreateForm">
          <ElButton v-if="!isEditMode" @click="resetCreateForm">重置</ElButton>
          <ElButton
            v-if="!isEditMode"
            :loading="duplicateChecking"
            @click="handleDuplicateCheck"
          >
            重复预警
          </ElButton>
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
            {{ isEditMode ? '保存并前往标本登记' : '保存并前往标本登记' }}
          </ElButton>
        </template>
        <template v-else-if="activeTab === IMPORT_TAB && canShowImportTab">
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
            保存并前往标本登记
          </ElButton>
        </template>
      </div>
    </template>
  </ElDialog>
</template>
