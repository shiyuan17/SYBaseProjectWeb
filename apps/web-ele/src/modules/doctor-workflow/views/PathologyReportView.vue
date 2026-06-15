<script setup lang="ts">
import type {
  CaseReportVersionSummary,
  DiagnosticTaskActionRequest,
  RejectPathologyReportRequest,
} from '../types/doctor-workflow';

import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  issueFormalReportVersions,
  listCaseReportVersions,
  printFormalReportVersions,
  publishPathologyReport,
  recallFormalReportVersions,
  rejectPathologyReport,
  reviewPathologyReport,
  signPathologyReport,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatReportDeliveryStatus,
  formatReportPrintStatus,
  formatReportStatus,
} from '../utils/format';
import { firstQueryParam } from '../utils/route';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const saving = ref(false);
const pageError = ref('');
const queryCaseId = ref('');
const queryPathologyNo = ref('');
const queryReportId = ref('');
const reportRows = ref<CaseReportVersionSummary[]>([]);
const selectedRows = ref<CaseReportVersionSummary[]>([]);
const selectedVersionIds = ref<string[]>([]);
const reportTableRef = ref<InstanceType<typeof ElTable> | null>(null);

const isCurrentReportRoute = computed(
  () =>
    route.name === 'PathologyReport' ||
    route.path === '/doctor-workflow/report',
);
const caseId = computed(() => firstQueryParam(route.query.caseId));
const pathologyNo = computed(() => firstQueryParam(route.query.pathologyNo));
const reportIdFromRoute = computed(() => firstQueryParam(route.query.reportId));
const caseIdentifier = computed(() => caseId.value || pathologyNo.value);
const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
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
  operatorName: '',
  rejectReason: '',
});

const actionPayload = computed<DiagnosticTaskActionRequest>(() => ({
  operatorName: form.operatorName,
}));

function ensureOperator() {
  if (!form.operatorName.trim()) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

function resetSelection() {
  selectedRows.value = [];
  selectedVersionIds.value = [];
}

function resetPageState() {
  pageError.value = '';
  reportRows.value = [];
  resetSelection();
}

function isSingleSelectionActionAvailable(
  action: 'publish' | 'reject' | 'review' | 'sign',
) {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择一条报告');
    return false;
  }
  if (selectedRows.value.length > 1) {
    ElMessage.warning('该操作一次只能处理一条报告');
    return false;
  }
  const row = getSingleSelectedRow();
  if (!row) {
    return false;
  }
  const status = row.versionStatus;
  const statusAllowedMap: Record<typeof action, string[]> = {
    publish: ['SIGNED'],
    reject: ['SUBMITTED', 'REVIEWED'],
    review: ['SUBMITTED'],
    sign: ['REVIEWED'],
  };
  if (!statusAllowedMap[action].includes(status ?? '')) {
    const actionLabelMap: Record<typeof action, string> = {
      publish: '发布',
      reject: '驳回',
      review: '审核通过',
      sign: '签发',
    };
    ElMessage.warning(
      `当前报告状态不可执行${actionLabelMap[action]}：${formatReportStatus(status)}`,
    );
    return false;
  }
  return true;
}

function selectRowByReportId(targetReportId: string) {
  const row = reportRows.value.find((item) => item.reportId === targetReportId);
  if (!row) {
    return;
  }
  nextTick(() => {
    reportTableRef.value?.clearSelection();
    reportTableRef.value?.toggleRowSelection(row, true);
  });
}

async function loadReportList(targetIdentifier = caseIdentifier.value) {
  const normalizedIdentifier = targetIdentifier.trim();
  if (!normalizedIdentifier) {
    resetPageState();
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const result = await listCaseReportVersions(normalizedIdentifier);
    reportRows.value = result;
    resetSelection();
    if (reportIdFromRoute.value) {
      selectRowByReportId(reportIdFromRoute.value);
    }
  } catch (error) {
    resetPageState();
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function collectBatchActionSummaryMessage(
  actionLabel: string,
  successLabel: string,
  successCount: number,
  failureCount: number,
) {
  if (failureCount > 0 && successCount > 0) {
    return `${actionLabel}完成：${successLabel}${successCount} 条，跳过 ${failureCount} 条`;
  }
  if (failureCount > 0) {
    return `${actionLabel}未完成：共跳过 ${failureCount} 条`;
  }
  return `${actionLabel}完成：${successLabel}${successCount} 条`;
}

function handleSelectionChange(rows: CaseReportVersionSummary[]) {
  selectedRows.value = rows;
  selectedVersionIds.value = rows.map((item) => item.versionId);
}

function getSingleSelectedRow() {
  return selectedRows.value[0] ?? null;
}

async function runFormalReportBatchAction(
  action: 'issue' | 'print' | 'recall',
) {
  if (!canPublish.value) {
    ElMessage.warning('当前账号没有批量报告操作权限');
    return;
  }
  if (selectedVersionIds.value.length === 0) {
    ElMessage.warning('请先勾选报告列表');
    return;
  }

  const actionMap = {
    issue: issueFormalReportVersions,
    print: printFormalReportVersions,
    recall: recallFormalReportVersions,
  };
  const labelMap = {
    issue: ['发放', '成功'],
    print: ['打印', '成功'],
    recall: ['回收', '成功'],
  } as const;

  saving.value = true;
  try {
    const result = await actionMap[action]({
      versionIds: selectedVersionIds.value,
    });
    ElMessage.success(
      collectBatchActionSummaryMessage(
        labelMap[action][0],
        labelMap[action][1],
        result.successCount,
        result.failureCount,
      ),
    );
    if (caseIdentifier.value) {
      await loadReportList(caseIdentifier.value);
    }
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function runLifecycleAction(action: 'publish' | 'review' | 'sign') {
  const permissionMap = {
    publish: canPublish.value,
    review: canReview.value,
    sign: canSign.value,
  };
  const actionLabelMap = {
    publish: '发布',
    review: '审核',
    sign: '签发',
  };

  if (!permissionMap[action]) {
    ElMessage.warning(`当前账号没有${actionLabelMap[action]}权限`);
    return;
  }
  if (!ensureOperator() || !isSingleSelectionActionAvailable(action)) {
    return;
  }

  const row = getSingleSelectedRow();
  if (!row) {
    return;
  }
  const actionMap = {
    publish: publishPathologyReport,
    review: reviewPathologyReport,
    sign: signPathologyReport,
  };

  saving.value = true;
  try {
    await actionMap[action](row.reportId, actionPayload.value);
    ElMessage.success('报告状态已更新');
    if (caseIdentifier.value) {
      await loadReportList(caseIdentifier.value);
      selectRowByReportId(row.reportId);
    }
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
  if (!ensureOperator() || !isSingleSelectionActionAvailable('reject')) {
    return;
  }
  if (!form.rejectReason.trim()) {
    ElMessage.warning('请填写驳回原因');
    return;
  }

  const row = getSingleSelectedRow();
  if (!row) {
    return;
  }
  const payload: RejectPathologyReportRequest = {
    operatorName: form.operatorName,
    rejectReason: form.rejectReason,
  };

  saving.value = true;
  try {
    await rejectPathologyReport(row.reportId, payload);
    ElMessage.success('报告已驳回');
    if (caseIdentifier.value) {
      await loadReportList(caseIdentifier.value);
      selectRowByReportId(row.reportId);
    }
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

function searchReportContext() {
  const normalizedCaseId = queryCaseId.value.trim();
  const normalizedPathologyNo = queryPathologyNo.value.trim();
  if (!normalizedCaseId && !normalizedPathologyNo) {
    ElMessage.warning('请输入病例 ID 或病理号');
    return;
  }

  const normalizedReportId = queryReportId.value.trim();
  void router.replace({
    path: '/doctor-workflow/report',
    query: {
      caseId: normalizedCaseId || undefined,
      pathologyNo: normalizedCaseId ? normalizedPathologyNo || undefined : normalizedPathologyNo,
      reportId: normalizedReportId || undefined,
    },
  });
}

function handleReset() {
  queryCaseId.value = '';
  queryPathologyNo.value = '';
  queryReportId.value = '';
  form.operatorName = '';
  form.rejectReason = '';
  resetPageState();
  void router.replace({
    path: '/doctor-workflow/report',
    query: {},
  });
}

watch(
  [isCurrentReportRoute, caseId, pathologyNo, reportIdFromRoute],
  ([isActive, currentCaseId, currentPathologyNo, currentReportId]) => {
    if (!isActive) {
      return;
    }

    queryCaseId.value = currentCaseId;
    queryPathologyNo.value = currentPathologyNo;
    queryReportId.value = currentReportId;

    const currentIdentifier = currentCaseId || currentPathologyNo;
    if (!currentIdentifier) {
      resetPageState();
      return;
    }
    void loadReportList(currentIdentifier);
  },
  { immediate: true },
);
</script>

<template>
  <Page
    :show-header="false"
    title="报告列表与流转"
    description="按病例或病理号查询报告列表，并完成审核、驳回、签发、发布以及打印、发放、回收。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard title="报告查询">
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID">
            <ElInput
              v-model="queryCaseId"
              clearable
              placeholder="请输入病例 ID"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem label="病理号">
            <ElInput
              v-model="queryPathologyNo"
              clearable
              placeholder="请输入病理号"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem label="报告 ID">
            <ElInput
              v-model="queryReportId"
              clearable
              placeholder="用于定位指定报告"
              style="width: 220px"
              @keyup.enter="searchReportContext"
            />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput
              v-model="form.operatorName"
              clearable
              placeholder="请输入操作人姓名"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem v-if="canReview" label="驳回原因">
            <ElInput
              v-model="form.rejectReason"
              clearable
              placeholder="驳回时必填"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem>
            <div class="flex flex-wrap gap-2">
              <ElButton
                :loading="loading"
                type="primary"
                @click="searchReportContext"
              >
                查询
              </ElButton>
              <ElButton @click="handleReset">重置</ElButton>
              <ElButton
                v-if="canReview"
                :loading="saving"
                @click="runLifecycleAction('review')"
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
                @click="runLifecycleAction('sign')"
              >
                签发
              </ElButton>
              <ElButton
                v-if="canPublish"
                :loading="saving"
                @click="runLifecycleAction('publish')"
              >
                发布
              </ElButton>
            </div>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="报告列表">
        <template v-if="caseIdentifier && canPublish" #extra>
          <div class="flex flex-wrap gap-2">
            <ElButton
              :disabled="selectedVersionIds.length === 0"
              :loading="saving"
              @click="runFormalReportBatchAction('print')"
            >
              打印
            </ElButton>
            <ElButton
              :disabled="selectedVersionIds.length === 0"
              :loading="saving"
              type="primary"
              @click="runFormalReportBatchAction('issue')"
            >
              发放
            </ElButton>
            <ElButton
              :disabled="selectedVersionIds.length === 0"
              :loading="saving"
              type="danger"
              @click="runFormalReportBatchAction('recall')"
            >
              回收
            </ElButton>
          </div>
        </template>
        <ElEmpty
          v-if="!caseIdentifier"
          description="请输入病例 ID 或病理号查询报告列表，或从报告追踪页进入。"
        />
        <ElTable
          v-else
          ref="reportTableRef"
          :data="reportRows"
          border
          row-key="versionId"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn type="selection" width="48" />
          <ElTableColumn label="版本号" min-width="96" prop="versionNo" />
          <ElTableColumn label="报告号" min-width="140" prop="reportNo" />
          <ElTableColumn label="生命周期状态" min-width="120">
            <template #default="{ row }">
              <ElTag type="info">
                {{ formatReportStatus(row.versionStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="提交时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.submittedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审核时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.reviewedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="签发时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.signedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="发布时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.publishedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="打印状态" min-width="120">
            <template #default="{ row }">
              {{ formatReportPrintStatus(row.printStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="打印时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.printedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="发放状态" min-width="120">
            <template #default="{ row }">
              {{ formatReportDeliveryStatus(row.deliveryStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="发放时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.issuedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="回收时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.recalledAt) }}
            </template>
          </ElTableColumn>
          <template #empty>
            <ElEmpty description="当前病例暂无报告" />
          </template>
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
