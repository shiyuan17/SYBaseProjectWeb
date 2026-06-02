<script setup lang="ts">
import type {
  ApplicationManageDialogMode,
  ApplicationManageSubmitMode,
} from '../utils/application-manage-dialog';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElDatePicker,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';
import { GENDER_OPTIONS } from '#/modules/system-management/constants';

import { useApplicationManageDialog } from '../composables/useApplicationManageDialog';
import { APPLICATION_TYPE_OPTIONS } from '../constants';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = withDefaults(
  defineProps<{
    applicationId?: null | string;
    mode?: ApplicationManageDialogMode;
    modelValue: boolean;
  }>(),
  {
    applicationId: null,
    mode: 'create',
  },
);

const emit = defineEmits<{
  submitted: [{ applicationId: string; mode: ApplicationManageSubmitMode }];
  'update:modelValue': [boolean];
}>();

const {
  CREATE_TAB,
  IMPORT_TAB,
  activeTab,
  canShowCreateForm,
  canShowImportTab,
  canSubmitCreateForm,
  closeDialog,
  clinicalSymptomSuggestion,
  confirmDuplicateWarning,
  createForm,
  createFormDescription,
  createFormTitle,
  creatingApplication,
  dialogTitle,
  dialogVisible,
  duplicateCheckMessage,
  duplicateChecking,
  duplicateSuggestedAction,
  editableApplicationFormStatusOptions,
  handleClinicalSymptomSuggestionChange,
  handleDuplicateCheck,
  handlePatientIdentifierLookup,
  hasDialogCapability,
  importForm,
  importingClinicalApplication,
  isEditMode,
  loadingApplicationDetail,
  pageError,
  resetCreateForm,
  resetImportForm,
  submitCreateApplication,
  submitImportClinicalApplication,
  workflowReferenceOptions,
} = useApplicationManageDialog(props, emit);
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
        v-if="false"
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
                    @blur="handlePatientIdentifierLookup"
                    @keyup.enter="handlePatientIdentifierLookup"
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
                <ElFormItem label="申请单随附">
                  <ElSelect
                    v-model="createForm.applicationFormStatus"
                    placeholder="请选择随附状态"
                  >
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
                :type="
                  duplicateSuggestedAction === 'BLOCK' ? 'warning' : 'info'
                "
                class="mb-4"
                show-icon
              />
              <div
                v-if="
                  duplicateCheckMessage &&
                  duplicateSuggestedAction === 'CONFIRM'
                "
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
        :description="
          isEditMode
            ? '当前账号没有申请单编辑权限'
            : '当前账号没有申请单创建或导入权限'
        "
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
