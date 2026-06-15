<script setup lang="ts">
import type {
  DiagnosticWorkbenchView,
  ReportRevisionOperationResult,
  RevisionRequestSummary,
} from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
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
  approveReportRevisionRequest,
  createReportRevisionRequest,
  getDiagnosticWorkbench,
  rejectReportRevisionRequest,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
  formatReportStatus,
  formatRevisionStatus,
} from '../utils/format';

type RevisionRow =
  | (RevisionRequestSummary & {
      caseId: string;
      pathologyNo?: null | string;
      rowType: 'revision';
    })
  | {
      caseId: string;
      currentVersionNo?: null | number;
      pathologyNo?: null | string;
      reportId: string;
      reportStatus?: null | string;
      rowType: 'current-report';
    };

const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const operating = ref(false);
const pageError = ref('');
const workbench = ref<DiagnosticWorkbenchView | null>(null);
const lastResult = ref<null | ReportRevisionOperationResult>(null);
const createDialogVisible = ref(false);
const reviewDialogVisible = ref(false);
const activeCreateRow = ref<Extract<
  RevisionRow,
  { rowType: 'current-report' }
> | null>(null);
const activeReviewRow = ref<Extract<
  RevisionRow,
  { rowType: 'revision' }
> | null>(null);
const reviewAction = ref<'approve' | 'reject'>('approve');

const queryForm = reactive({
  caseIdentifier: '',
  status: '',
});

const createForm = reactive({
  operatorName: '',
  remarks: '',
  reportId: '',
  requestReason: '',
  terminalCode: '',
});

const reviewForm = reactive({
  operatorName: '',
  rejectReason: '',
  remarks: '',
  requestId: '',
  terminalCode: '',
});

const canCreateRevision = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.REVISION_REQUEST_CREATE),
);
const canReviewRevision = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.REVISION_APPROVE),
);

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '待审批', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已驳回', value: 'REJECTED' },
] as const;

const revisionRows = computed<RevisionRow[]>(() => {
  if (!workbench.value) {
    return [];
  }

  const rows: RevisionRow[] = [];
  if (workbench.value.currentReport?.reportId) {
    rows.push({
      caseId: workbench.value.caseId,
      currentVersionNo: workbench.value.currentReport.versionNo,
      pathologyNo: workbench.value.pathologyNo,
      reportId: workbench.value.currentReport.reportId,
      reportStatus: workbench.value.currentReport.reportStatus,
      rowType: 'current-report',
    });
  }

  for (const item of workbench.value.revisions) {
    rows.push({
      ...item,
      caseId: workbench.value.caseId,
      pathologyNo: workbench.value.pathologyNo,
      rowType: 'revision',
    });
  }

  if (!queryForm.status) {
    return rows;
  }
  return rows.filter(
    (row) =>
      row.rowType === 'current-report' ||
      row.requestStatus === queryForm.status,
  );
});

function getDefaultOperatorName() {
  return userStore.userInfo?.realName?.trim() || '';
}

function ensureOperator(operatorName: string) {
  if (!operatorName.trim()) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

async function loadWorkbench() {
  const normalizedCaseIdentifier = queryForm.caseIdentifier.trim();
  if (!normalizedCaseIdentifier) {
    ElMessage.warning('请输入病例 ID 或病理号');
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    workbench.value = await getDiagnosticWorkbench(normalizedCaseIdentifier);
  } catch (error) {
    workbench.value = null;
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  queryForm.caseIdentifier = '';
  queryForm.status = '';
  pageError.value = '';
  workbench.value = null;
}

function openCreateDialog(
  row: Extract<RevisionRow, { rowType: 'current-report' }>,
) {
  activeCreateRow.value = row;
  createForm.operatorName = getDefaultOperatorName();
  createForm.remarks = '';
  createForm.reportId = row.reportId;
  createForm.requestReason = '';
  createForm.terminalCode = '';
  createDialogVisible.value = true;
}

function openReviewDialog(
  row: Extract<RevisionRow, { rowType: 'revision' }>,
  action: 'approve' | 'reject',
) {
  activeReviewRow.value = row;
  reviewAction.value = action;
  reviewForm.operatorName = getDefaultOperatorName();
  reviewForm.rejectReason = '';
  reviewForm.remarks = '';
  reviewForm.requestId = row.requestId;
  reviewForm.terminalCode = '';
  reviewDialogVisible.value = true;
}

async function submitCreateRevision() {
  if (!activeCreateRow.value) {
    return;
  }
  if (!createForm.reportId.trim() || !createForm.requestReason.trim()) {
    ElMessage.warning('请填写修订原因');
    return;
  }
  if (!ensureOperator(createForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await createReportRevisionRequest({
      operatorName: createForm.operatorName.trim(),
      remarks: createForm.remarks.trim() || undefined,
      reportId: createForm.reportId.trim(),
      requestReason: createForm.requestReason.trim(),
      terminalCode: createForm.terminalCode.trim() || undefined,
    });
    ElMessage.success('修订申请已发起');
    createDialogVisible.value = false;
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function submitReviewRevision() {
  if (!activeReviewRow.value) {
    return;
  }
  if (!reviewForm.requestId.trim()) {
    ElMessage.warning('缺少修订申请 ID');
    return;
  }
  if (!ensureOperator(reviewForm.operatorName)) {
    return;
  }
  if (reviewAction.value === 'reject' && !reviewForm.rejectReason.trim()) {
    ElMessage.warning('驳回修订申请需要填写驳回原因');
    return;
  }

  operating.value = true;
  try {
    const payload = {
      operatorName: reviewForm.operatorName.trim(),
      rejectReason: reviewForm.rejectReason.trim() || undefined,
      remarks: reviewForm.remarks.trim() || undefined,
      terminalCode: reviewForm.terminalCode.trim() || undefined,
    };
    lastResult.value =
      reviewAction.value === 'approve'
        ? await approveReportRevisionRequest(
            reviewForm.requestId.trim(),
            payload,
          )
        : await rejectReportRevisionRequest(
            reviewForm.requestId.trim(),
            payload,
          );

    ElMessage.success(
      reviewAction.value === 'approve' ? '修订申请已通过' : '修订申请已驳回',
    );
    reviewDialogVisible.value = false;
    await loadWorkbench();

    if (
      reviewAction.value === 'approve' &&
      lastResult.value.caseId &&
      lastResult.value.reportId
    ) {
      void router.push({
        path: '/doctor-workflow/report',
        query: {
          caseId: lastResult.value.caseId,
          reportId: lastResult.value.reportId,
          tab: 'revision',
        },
      });
    }
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function handleActionCommand(command: string, row: RevisionRow) {
  if (row.rowType === 'current-report' && command === 'create') {
    openCreateDialog(row);
    return;
  }
  if (row.rowType === 'revision' && command === 'approve') {
    openReviewDialog(row, 'approve');
    return;
  }
  if (row.rowType === 'revision' && command === 'reject') {
    openReviewDialog(row, 'reject');
  }
}

function canApproveRow(row: Extract<RevisionRow, { rowType: 'revision' }>) {
  return canReviewRevision.value && row.requestStatus === 'PENDING';
}
</script>

<template>
  <Page
    :show-header="false"
    title="报告修订管理"
    description="顶部查询病例，下方集中查看修订链路，并在操作列中发起或审批修订申请。"
  >
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard title="查询与筛选">
        <ElForm inline label-width="104px">
          <ElFormItem label-width="132px" required>
            <template #label>
              <span class="whitespace-nowrap">病例 ID / 病理号</span>
            </template>
            <ElInput
              v-model="queryForm.caseIdentifier"
              clearable
              placeholder="请输入病例 ID 或病理号"
              style="width: 260px"
              @keyup.enter="loadWorkbench"
            />
          </ElFormItem>
          <ElFormItem label="修订状态">
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
            <ElButton :loading="loading" type="primary" @click="loadWorkbench">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="修订列表">
        <ElEmpty
          v-if="!loading && !pageError && !workbench"
          description="请输入病例 ID 或病理号查询修订数据"
        />
        <ElEmpty
          v-else-if="!loading && !pageError && revisionRows.length === 0"
          description="当前病例暂无修订数据"
        />
        <ElEmpty v-else-if="pageError" :description="pageError" />
        <ElTable v-else v-loading="loading" :data="revisionRows" border>
          <ElTableColumn label="行类型" min-width="110">
            <template #default="{ row }">
              {{ row.rowType === 'current-report' ? '当前报告' : '修订申请' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="报告ID / 申请ID" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report' ? row.reportId : row.requestId
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="当前版本" min-width="100">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? formatNullable(row.currentVersionNo)
                  : formatNullable(row.currentVersionNo)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="修订原因" min-width="220">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? formatReportStatus(row.reportStatus)
                  : formatNullable(row.requestReason)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请人" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '-'
                  : formatNullable(row.requestedByName)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请时间" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '-'
                  : formatDateTime(row.requestedAt)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审批状态" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '可发起'
                  : formatRevisionStatus(row.requestStatus)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审批人" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '-'
                  : formatNullable(row.reviewedByName)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审批时间" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '-'
                  : formatDateTime(row.reviewedAt)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="新版本号" min-width="100">
            <template #default="{ row }">
              {{
                row.rowType === 'current-report'
                  ? '-'
                  : formatNullable(row.approvedVersionNo)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="150">
            <template #default="{ row }">
              <ElDropdown
                v-if="
                  (row.rowType === 'current-report' && canCreateRevision) ||
                  (row.rowType === 'revision' && canReviewRevision)
                "
                @command="
                  (command) => handleActionCommand(String(command), row)
                "
              >
                <ElButton size="small" type="primary"> 操作 </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem
                      v-if="row.rowType === 'current-report'"
                      command="create"
                    >
                      发起修订申请
                    </ElDropdownItem>
                    <template v-else>
                      <ElDropdownItem
                        command="approve"
                        :disabled="!canApproveRow(row)"
                      >
                        审批通过
                      </ElDropdownItem>
                      <ElDropdownItem
                        command="reject"
                        :disabled="!canApproveRow(row)"
                      >
                        审批驳回
                      </ElDropdownItem>
                    </template>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
              <span v-else class="text-sm text-muted-foreground"
                >无可用操作</span
              >
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="最近操作结果">
        <ElDescriptions :column="4" border>
          <ElDescriptionsItem label="申请ID">
            {{ formatNullable(lastResult?.requestId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(lastResult?.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告ID">
            {{ formatNullable(lastResult?.reportId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            {{ formatRevisionStatus(lastResult?.requestStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="新版本号">
            {{ formatNullable(lastResult?.approvedVersionNo) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>

    <ElDialog v-model="createDialogVisible" title="发起修订申请" width="560px">
      <ElForm label-width="96px">
        <ElFormItem label="报告ID">
          <ElInput v-model="createForm.reportId" disabled />
        </ElFormItem>
        <ElFormItem label="修订原因" required>
          <ElInput
            v-model="createForm.requestReason"
            :rows="4"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="createForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="createForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="createForm.remarks" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="operating"
          type="primary"
          @click="submitCreateRevision"
        >
          提交
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="reviewDialogVisible"
      :title="
        reviewAction === 'approve' ? '审批通过修订申请' : '审批驳回修订申请'
      "
      width="560px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="申请ID">
          <ElInput v-model="reviewForm.requestId" disabled />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="reviewForm.operatorName" />
        </ElFormItem>
        <ElFormItem v-if="reviewAction === 'reject'" label="驳回原因" required>
          <ElInput
            v-model="reviewForm.rejectReason"
            :rows="4"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="reviewForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="reviewForm.remarks" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="reviewDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="operating"
          :type="reviewAction === 'approve' ? 'success' : 'danger'"
          @click="submitReviewRevision"
        >
          {{ reviewAction === 'approve' ? '确认通过' : '确认驳回' }}
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
