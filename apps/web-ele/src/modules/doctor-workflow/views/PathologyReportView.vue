<script setup lang="ts">
import type {
  DiagnosticTaskActionRequest,
  RejectPathologyReportRequest,
  SavePathologyReportDraftRequest,
} from '../types/doctor-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import {
  createPathologyReport,
  getDiagnosticWorkbench,
  publishPathologyReport,
  rejectPathologyReport,
  reviewPathologyReport,
  savePathologyReportDraft,
  signPathologyReport,
  submitPathologyReport,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable, formatReportStatus } from '../utils/format';
import { firstQueryParam } from '../utils/route';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const saving = ref(false);
const pageError = ref('');
const activeReportId = ref('');
const reportStatus = ref<null | string>(null);
const reportNo = ref<null | string>(null);
const versionNo = ref<null | number>(null);
const queryCaseId = ref('');
const queryTaskId = ref('');
const queryReportId = ref('');

const caseId = computed(() => firstQueryParam(route.query.caseId));
const taskId = computed(() => firstQueryParam(route.query.taskId));
const reportIdFromRoute = computed(() => firstQueryParam(route.query.reportId));
const isCurrentReportRoute = computed(
  () =>
    route.name === 'PathologyReport' ||
    route.path === '/doctor-workflow/report',
);
const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canCreateDraft = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.REPORT_CREATE),
);
const canSubmit = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.REPORT_SUBMIT),
);
const canReview = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.REPORT_REVIEW),
);
const canSign = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.REPORT_SIGN),
);
const canPublish = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.REPORT_PUBLISH),
);

const form = reactive({
  clinicalDiagnosis: '',
  finalDiagnosis: '',
  grossExam: '',
  microscopicExam: '',
  operatorName: '',
  rejectReason: '',
  remarks: '',
  richTextContent: '',
  terminalCode: '',
});

const actionPayload = computed<DiagnosticTaskActionRequest>(() => ({
  operatorName: form.operatorName,
  remarks: form.remarks || undefined,
  terminalCode: form.terminalCode || undefined,
}));

function ensureOperator() {
  if (!form.operatorName) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

function ensureReport() {
  if (!activeReportId.value) {
    ElMessage.warning('请先创建报告草稿');
    return false;
  }
  return true;
}

function resetReportState() {
  pageError.value = '';
  activeReportId.value = '';
  reportStatus.value = null;
  reportNo.value = null;
  versionNo.value = null;
  form.clinicalDiagnosis = '';
  form.finalDiagnosis = '';
  form.grossExam = '';
  form.microscopicExam = '';
  form.rejectReason = '';
  form.richTextContent = '';
}

async function loadReportContext(targetCaseId = caseId.value) {
  const normalizedCaseId = targetCaseId.trim();
  if (!normalizedCaseId) {
    resetReportState();
    return;
  }

  activeReportId.value = reportIdFromRoute.value;
  loading.value = true;
  pageError.value = '';
  try {
    const workbench = await getDiagnosticWorkbench(normalizedCaseId);
    const currentReport = workbench.currentReport;

    if (currentReport) {
      activeReportId.value = activeReportId.value || currentReport.reportId;
      reportNo.value = currentReport.reportNo ?? null;
      reportStatus.value = currentReport.reportStatus ?? null;
      versionNo.value = currentReport.versionNo ?? null;
      form.clinicalDiagnosis = currentReport.clinicalDiagnosis ?? '';
      form.finalDiagnosis = currentReport.finalDiagnosis ?? '';
      form.grossExam = currentReport.grossExam ?? '';
      form.microscopicExam = currentReport.microscopicExam ?? '';
      form.richTextContent = currentReport.richTextContent ?? '';
    } else {
      activeReportId.value = '';
      reportNo.value = null;
      reportStatus.value = null;
      versionNo.value = null;
      form.clinicalDiagnosis = workbench.clinicalDiagnosis ?? '';
      form.finalDiagnosis = '';
      form.grossExam = '';
      form.microscopicExam = '';
      form.richTextContent = '';
    }
  } catch (error) {
    resetReportState();
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function searchReportContext() {
  const normalizedCaseId = queryCaseId.value.trim();
  if (!normalizedCaseId) {
    ElMessage.warning('请输入病例 ID');
    return;
  }

  const normalizedTaskId = queryTaskId.value.trim();
  const normalizedReportId = queryReportId.value.trim();
  void router.replace({
    path: '/doctor-workflow/report',
    query: {
      caseId: normalizedCaseId,
      taskId: normalizedTaskId || undefined,
      reportId: normalizedReportId || undefined,
    },
  });
}

function handleReset() {
  queryCaseId.value = '';
  queryTaskId.value = '';
  queryReportId.value = '';
  resetReportState();
  void router.replace({
    path: '/doctor-workflow/report',
    query: {},
  });
}

async function createDraft() {
  if (!canCreateDraft.value) {
    ElMessage.warning('当前账号没有创建草稿权限');
    return;
  }
  if (!caseId.value || !taskId.value) {
    ElMessage.warning('创建报告草稿需要病例 ID 和诊断任务 ID');
    return;
  }
  if (!ensureOperator()) {
    return;
  }

  saving.value = true;
  try {
    const result = await createPathologyReport({
      caseId: caseId.value,
      clinicalDiagnosis: form.clinicalDiagnosis,
      finalDiagnosis: form.finalDiagnosis,
      grossExam: form.grossExam,
      microscopicExam: form.microscopicExam,
      operatorName: form.operatorName,
      remarks: form.remarks || undefined,
      richTextContent: form.richTextContent,
      taskId: taskId.value,
      terminalCode: form.terminalCode || undefined,
    });
    activeReportId.value = result.reportId;
    reportNo.value = result.reportNo ?? null;
    reportStatus.value = result.reportStatus ?? null;
    versionNo.value = result.versionNo ?? null;
    ElMessage.success('报告草稿已创建');
    await router.replace({
      path: '/doctor-workflow/report',
      query: {
        ...route.query,
        reportId: result.reportId,
      },
    });
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function saveDraft() {
  if (!canCreateDraft.value) {
    ElMessage.warning('当前账号没有保存草稿权限');
    return;
  }
  if (!ensureReport() || !ensureOperator()) {
    return;
  }

  const payload: SavePathologyReportDraftRequest = {
    clinicalDiagnosis: form.clinicalDiagnosis,
    finalDiagnosis: form.finalDiagnosis,
    grossExam: form.grossExam,
    microscopicExam: form.microscopicExam,
    operatorName: form.operatorName,
    remarks: form.remarks || undefined,
    richTextContent: form.richTextContent,
    terminalCode: form.terminalCode || undefined,
  };

  saving.value = true;
  try {
    const result = await savePathologyReportDraft(
      activeReportId.value,
      payload,
    );
    reportStatus.value = result.reportStatus ?? null;
    versionNo.value = result.versionNo ?? null;
    ElMessage.success('报告草稿已保存');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function runReportAction(
  action: 'publish' | 'review' | 'sign' | 'submit',
) {
  const permissionMap = {
    publish: canPublish.value,
    review: canReview.value,
    sign: canSign.value,
    submit: canSubmit.value,
  };
  const actionLabelMap = {
    publish: '发布',
    review: '审核',
    sign: '签发',
    submit: '提交',
  };

  if (!permissionMap[action]) {
    ElMessage.warning(`当前账号没有${actionLabelMap[action]}权限`);
    return;
  }
  if (!ensureReport() || !ensureOperator()) {
    return;
  }

  const actionMap = {
    publish: publishPathologyReport,
    review: reviewPathologyReport,
    sign: signPathologyReport,
    submit: submitPathologyReport,
  };

  saving.value = true;
  try {
    const result = await actionMap[action](
      activeReportId.value,
      actionPayload.value,
    );
    reportStatus.value = result.reportStatus ?? null;
    versionNo.value = result.versionNo ?? null;
    ElMessage.success('报告状态已更新');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function rejectReport() {
  if (!canReview.value) {
    ElMessage.warning('当前账号没有驳回权限');
    return;
  }
  if (!ensureReport() || !ensureOperator()) {
    return;
  }
  if (!form.rejectReason) {
    ElMessage.warning('请填写驳回原因');
    return;
  }

  const payload: RejectPathologyReportRequest = {
    operatorName: form.operatorName,
    rejectReason: form.rejectReason,
    terminalCode: form.terminalCode || undefined,
  };

  saving.value = true;
  try {
    const result = await rejectPathologyReport(activeReportId.value, payload);
    reportStatus.value = result.reportStatus ?? null;
    versionNo.value = result.versionNo ?? null;
    ElMessage.success('报告已驳回');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

watch(
  [isCurrentReportRoute, caseId, taskId, reportIdFromRoute],
  ([isActive, currentCaseId, currentTaskId, currentReportId]) => {
    if (!isActive) {
      return;
    }

    queryCaseId.value = currentCaseId;
    queryTaskId.value = currentTaskId;
    queryReportId.value = currentReportId;

    if (!currentCaseId) {
      resetReportState();
      return;
    }
    void loadReportContext(currentCaseId);
  },
  { immediate: true },
);
</script>

<template>
  <Page
    :show-header="false"
    title="报告编辑与流转"
    description="创建草稿、保存正文，并完成提交、审核、驳回、签发、发布闭环。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="false"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard title="报告查询">
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID" required>
            <ElInput
              v-model="queryCaseId"
              clearable
              placeholder="请输入病例 ID"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem label="任务 ID">
            <ElInput
              v-model="queryTaskId"
              clearable
              placeholder="创建草稿时必填"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem label="报告 ID">
            <ElInput
              v-model="queryReportId"
              clearable
              placeholder="已有报告可直接带入"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="loading"
              type="primary"
              @click="searchReportContext"
            >
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="报告上下文">
        <ElEmpty
          v-if="!caseId"
          description="请输入病例 ID 查询报告上下文，或从诊断平台工作站、报告追踪页进入。"
        />
        <ElDescriptions v-else :column="4" border>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="任务ID">
            {{ formatNullable(taskId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告号">
            {{ formatNullable(reportNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="版本">
            {{ formatNullable(versionNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告状态">
            <ElTag type="info">{{ formatReportStatus(reportStatus) }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告ID" :span="3">
            {{ formatNullable(activeReportId) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <template v-if="caseId">
        <WorkflowSectionCard title="报告正文">
          <ElForm label-width="100px">
            <ElFormItem label="临床诊断">
              <ElInput
                v-model="form.clinicalDiagnosis"
                maxlength="500"
                show-word-limit
                type="textarea"
              />
            </ElFormItem>
            <ElFormItem label="大体所见">
              <ElInput v-model="form.grossExam" :rows="4" type="textarea" />
            </ElFormItem>
            <ElFormItem label="镜下所见">
              <ElInput
                v-model="form.microscopicExam"
                :rows="4"
                type="textarea"
              />
            </ElFormItem>
            <ElFormItem label="最终诊断">
              <ElInput
                v-model="form.finalDiagnosis"
                :rows="4"
                maxlength="2000"
                show-word-limit
                type="textarea"
              />
            </ElFormItem>
            <ElFormItem label="富文本正文">
              <ElInput
                v-model="form.richTextContent"
                :rows="6"
                type="textarea"
              />
            </ElFormItem>
          </ElForm>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="流转操作">
          <ElForm label-width="100px">
            <ElFormItem label="操作人">
              <ElInput
                v-model="form.operatorName"
                placeholder="请输入操作人姓名"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput v-model="form.terminalCode" placeholder="终端编码" />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput v-model="form.remarks" type="textarea" />
            </ElFormItem>
            <ElFormItem v-if="canReview" label="驳回原因">
              <ElInput v-model="form.rejectReason" type="textarea" />
            </ElFormItem>
            <ElFormItem>
              <div class="flex flex-wrap gap-2">
                <ElButton
                  v-if="canCreateDraft"
                  :loading="saving"
                  type="primary"
                  @click="createDraft"
                >
                  创建草稿
                </ElButton>
                <ElButton
                  v-if="canCreateDraft"
                  :loading="saving"
                  type="success"
                  @click="saveDraft"
                >
                  保存草稿
                </ElButton>
                <ElButton
                  v-if="canSubmit"
                  :loading="saving"
                  @click="runReportAction('submit')"
                >
                  提交
                </ElButton>
                <ElButton
                  v-if="canReview"
                  :loading="saving"
                  @click="runReportAction('review')"
                >
                  审核通过
                </ElButton>
                <ElButton
                  v-if="canReview"
                  :loading="saving"
                  type="danger"
                  @click="rejectReport"
                >
                  驳回
                </ElButton>
                <ElButton
                  v-if="canSign"
                  :loading="saving"
                  @click="runReportAction('sign')"
                >
                  签发
                </ElButton>
                <ElButton
                  v-if="canPublish"
                  :loading="saving"
                  @click="runReportAction('publish')"
                >
                  发布
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </WorkflowSectionCard>
      </template>
    </div>
  </Page>
</template>
