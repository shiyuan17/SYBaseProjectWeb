<script setup lang="ts">
import type {
  ConsultationParticipantInput,
  ConsultationSummary,
  DiagnosticWorkbenchView,
} from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';

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
  commentConsultationParticipant,
  completeConsultation,
  createConsultation,
  getDiagnosticWorkbench,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatConsultationStatus,
  formatDateTime,
  formatNullable,
} from '../utils/format';

type ConsultationRow =
  | (ConsultationSummary & {
      caseId: string;
      pathologyNo?: null | string;
      rowType: 'consultation';
    })
  | {
      caseId: string;
      pathologyNo?: null | string;
      rowType: 'current-case';
    };

const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const operating = ref(false);
const pageError = ref('');
const workbench = ref<DiagnosticWorkbenchView | null>(null);
const participants = ref<ConsultationParticipantInput[]>([]);
const lastResult = ref<null | {
  caseId?: null | string;
  consultationId?: null | string;
  status?: null | string;
}>(null);

const createDialogVisible = ref(false);
const commentDialogVisible = ref(false);
const completeDialogVisible = ref(false);
const activeCreateRow = ref<Extract<
  ConsultationRow,
  { rowType: 'current-case' }
> | null>(null);
const activeConsultationRow = ref<Extract<
  ConsultationRow,
  { rowType: 'consultation' }
> | null>(null);

const queryForm = reactive({
  caseIdentifier: '',
  status: '',
});

const createForm = reactive({
  caseId: '',
  operatorName: '',
  participantName: '',
  participantRole: 'MEMBER',
  participantUserId: '',
  remarks: '',
  terminalCode: '',
});

const commentForm = reactive({
  consultationId: '',
  operatorName: '',
  opinion: '',
  participantId: '',
  remarks: '',
  terminalCode: '',
});

const completeForm = reactive({
  consultationId: '',
  operatorName: '',
  opinion: '',
  remarks: '',
  terminalCode: '',
});

const canCreateConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_CREATE),
);
const canCommentConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_COMMENT),
);
const canCompleteConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_COMPLETE),
);

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
] as const;

const consultationRows = computed<ConsultationRow[]>(() => {
  if (!workbench.value) {
    return [];
  }

  const rows: ConsultationRow[] = [
    {
      caseId: workbench.value.caseId,
      pathologyNo: workbench.value.pathologyNo,
      rowType: 'current-case',
    },
  ];

  for (const item of workbench.value.consultations) {
    rows.push({
      ...item,
      caseId: workbench.value.caseId,
      pathologyNo: workbench.value.pathologyNo,
      rowType: 'consultation',
    });
  }

  if (!queryForm.status) {
    return rows;
  }
  return rows.filter(
    (row) => row.rowType === 'current-case' || row.status === queryForm.status,
  );
});

const participantOptions = computed(() => {
  return activeConsultationRow.value?.participants ?? [];
});

function getDefaultOperatorName() {
  return userStore.userInfo?.realName?.trim() || '';
}

function getCurrentUserId() {
  return userStore.userInfo?.userId?.trim() || '';
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

function addParticipant() {
  if (
    !createForm.participantUserId.trim() ||
    !createForm.participantName.trim()
  ) {
    ElMessage.warning('请填写参与人 ID 和姓名');
    return;
  }
  participants.value.push({
    participantName: createForm.participantName.trim(),
    participantRole: createForm.participantRole.trim() || 'MEMBER',
    participantUserId: createForm.participantUserId.trim(),
  });
  createForm.participantName = '';
  createForm.participantRole = 'MEMBER';
  createForm.participantUserId = '';
}

function removeParticipant(index: number) {
  participants.value.splice(index, 1);
}

function openCreateDialog(
  row: Extract<ConsultationRow, { rowType: 'current-case' }>,
) {
  activeCreateRow.value = row;
  participants.value = [];
  createForm.caseId = row.caseId;
  createForm.operatorName = getDefaultOperatorName();
  createForm.participantName = '';
  createForm.participantRole = 'MEMBER';
  createForm.participantUserId = '';
  createForm.remarks = '';
  createForm.terminalCode = '';
  createDialogVisible.value = true;
}

function resolvePreferredParticipant(
  consultation: Extract<ConsultationRow, { rowType: 'consultation' }>,
) {
  const currentUserId = getCurrentUserId();
  const participantsInRow = consultation.participants ?? [];
  return (
    participantsInRow.find(
      (item) => item.participantUserId === currentUserId,
    ) ??
    participantsInRow[0] ??
    null
  );
}

function openCommentDialog(
  row: Extract<ConsultationRow, { rowType: 'consultation' }>,
) {
  activeConsultationRow.value = row;
  const preferredParticipant = resolvePreferredParticipant(row);
  commentForm.consultationId = row.consultationId;
  commentForm.operatorName = getDefaultOperatorName();
  commentForm.opinion = preferredParticipant?.opinion ?? '';
  commentForm.participantId = preferredParticipant?.participantId ?? '';
  commentForm.remarks = '';
  commentForm.terminalCode = '';
  commentDialogVisible.value = true;
}

function openCompleteDialog(
  row: Extract<ConsultationRow, { rowType: 'consultation' }>,
) {
  activeConsultationRow.value = row;
  completeForm.consultationId = row.consultationId;
  completeForm.operatorName = getDefaultOperatorName();
  completeForm.opinion = row.opinion ?? '';
  completeForm.remarks = '';
  completeForm.terminalCode = '';
  completeDialogVisible.value = true;
}

function handleParticipantChange(participantId: string) {
  const selected = participantOptions.value.find(
    (item) => item.participantId === participantId,
  );
  commentForm.opinion = selected?.opinion ?? '';
}

function canCommentRow(
  row: Extract<ConsultationRow, { rowType: 'consultation' }>,
) {
  return (
    canCommentConsultation.value &&
    row.status !== 'COMPLETED' &&
    (row.participants?.length ?? 0) > 0
  );
}

function canCompleteRow(
  row: Extract<ConsultationRow, { rowType: 'consultation' }>,
) {
  return canCompleteConsultation.value && row.status !== 'COMPLETED';
}

function handleActionCommand(command: string, row: ConsultationRow) {
  if (row.rowType === 'current-case' && command === 'create') {
    openCreateDialog(row);
    return;
  }
  if (row.rowType === 'consultation' && command === 'comment') {
    openCommentDialog(row);
    return;
  }
  if (row.rowType === 'consultation' && command === 'complete') {
    openCompleteDialog(row);
  }
}

async function submitCreateConsultation() {
  if (!activeCreateRow.value) {
    return;
  }
  if (!createForm.caseId.trim() || participants.value.length === 0) {
    ElMessage.warning('请至少添加一名参与人');
    return;
  }
  if (!ensureOperator(createForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await createConsultation({
      caseId: createForm.caseId.trim(),
      operatorName: createForm.operatorName.trim(),
      participants: participants.value,
      remarks: createForm.remarks.trim() || undefined,
      terminalCode: createForm.terminalCode.trim() || undefined,
    });
    ElMessage.success('会诊已发起');
    createDialogVisible.value = false;
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function submitComment() {
  if (!activeConsultationRow.value) {
    return;
  }
  if (
    !commentForm.consultationId.trim() ||
    !commentForm.participantId.trim() ||
    !commentForm.opinion.trim()
  ) {
    ElMessage.warning('请选择参与人并填写意见');
    return;
  }
  if (!ensureOperator(commentForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await commentConsultationParticipant(
      commentForm.consultationId.trim(),
      commentForm.participantId.trim(),
      {
        operatorName: commentForm.operatorName.trim(),
        opinion: commentForm.opinion.trim(),
        remarks: commentForm.remarks.trim() || undefined,
        terminalCode: commentForm.terminalCode.trim() || undefined,
      },
    );
    ElMessage.success('会诊意见已保存');
    commentDialogVisible.value = false;
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function submitComplete() {
  if (!activeConsultationRow.value) {
    return;
  }
  if (!completeForm.consultationId.trim() || !completeForm.opinion.trim()) {
    ElMessage.warning('请填写主持意见');
    return;
  }
  if (!ensureOperator(completeForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await completeConsultation(
      completeForm.consultationId.trim(),
      {
        operatorName: completeForm.operatorName.trim(),
        opinion: completeForm.opinion.trim(),
        remarks: completeForm.remarks.trim() || undefined,
        terminalCode: completeForm.terminalCode.trim() || undefined,
      },
    );
    ElMessage.success('会诊已完成');
    completeDialogVisible.value = false;
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}
</script>

<template>
  <Page
    :show-header="false"
    title="会诊管理"
    description="顶部查询病例，下方集中查看会诊列表，并在操作列中发起、录入意见和完成会诊。"
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
          <ElFormItem label="会诊状态">
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

      <WorkflowSectionCard title="会诊列表">
        <ElEmpty
          v-if="!loading && !pageError && !workbench"
          description="请输入病例 ID 或病理号查询会诊数据"
        />
        <ElEmpty
          v-else-if="!loading && !pageError && consultationRows.length === 0"
          description="当前病例暂无会诊数据"
        />
        <ElEmpty v-else-if="pageError" :description="pageError" />
        <ElTable v-else v-loading="loading" :data="consultationRows" border>
          <ElTableColumn label="行类型" min-width="110">
            <template #default="{ row }">
              {{ row.rowType === 'current-case' ? '当前病例' : '会诊记录' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="会诊ID" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? formatNullable(row.caseId)
                  : row.consultationId
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请人" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatNullable(row.requestedByName)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请时间" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatDateTime(row.requestedAt)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="主持人" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatNullable(row.hostName)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="会诊状态" min-width="120">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '可发起'
                  : formatConsultationStatus(row.status)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="参与人数" min-width="100">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatNullable(row.participantCount)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="主持意见" min-width="240">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatNullable(row.opinion)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="完成时间" min-width="180">
            <template #default="{ row }">
              {{
                row.rowType === 'current-case'
                  ? '-'
                  : formatDateTime(row.completedAt)
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="150">
            <template #default="{ row }">
              <ElDropdown
                v-if="
                  (row.rowType === 'current-case' && canCreateConsultation) ||
                  (row.rowType === 'consultation' &&
                    (canCommentConsultation || canCompleteConsultation))
                "
                @command="
                  (command) => handleActionCommand(String(command), row)
                "
              >
                <ElButton size="small" type="primary"> 操作 </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem
                      v-if="row.rowType === 'current-case'"
                      command="create"
                    >
                      发起会诊
                    </ElDropdownItem>
                    <template v-else>
                      <ElDropdownItem
                        command="comment"
                        :disabled="!canCommentRow(row)"
                      >
                        录入参与人意见
                      </ElDropdownItem>
                      <ElDropdownItem
                        command="complete"
                        :disabled="!canCompleteRow(row)"
                      >
                        完成会诊
                      </ElDropdownItem>
                    </template>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
              <span v-else class="text-sm text-muted-foreground">无可用操作</span>
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="最近操作结果">
        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="会诊ID">
            {{ formatNullable(lastResult?.consultationId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(lastResult?.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            {{ formatConsultationStatus(lastResult?.status) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>

    <ElDialog v-model="createDialogVisible" title="发起会诊" width="720px">
      <ElForm label-width="96px">
        <ElFormItem label="病例ID">
          <ElInput v-model="createForm.caseId" disabled />
        </ElFormItem>
        <ElFormItem label="参与人ID">
          <ElInput v-model="createForm.participantUserId" />
        </ElFormItem>
        <ElFormItem label="参与人姓名">
          <ElInput v-model="createForm.participantName" />
        </ElFormItem>
        <ElFormItem label="参与角色">
          <ElInput v-model="createForm.participantRole" />
        </ElFormItem>
        <ElFormItem>
          <ElButton @click="addParticipant">添加参与人</ElButton>
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

      <ElTable :data="participants" border max-height="240">
        <ElTableColumn label="用户ID" prop="participantUserId" />
        <ElTableColumn label="姓名" prop="participantName" />
        <ElTableColumn label="角色" prop="participantRole" />
        <ElTableColumn label="操作" width="100">
          <template #default="{ $index }">
            <ElButton link type="danger" @click="removeParticipant($index)">
              移除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="operating"
          type="primary"
          @click="submitCreateConsultation"
        >
          提交
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="commentDialogVisible"
      title="录入参与人意见"
      width="640px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="会诊ID">
          <ElInput v-model="commentForm.consultationId" disabled />
        </ElFormItem>
        <ElFormItem label="参与人" required>
          <ElSelect
            v-model="commentForm.participantId"
            placeholder="请选择参与人"
            style="width: 100%"
            @change="handleParticipantChange"
          >
            <ElOption
              v-for="item in participantOptions"
              :key="item.participantId"
              :label="`${formatNullable(item.participantName)} / ${formatNullable(item.participantRole)}`"
              :value="item.participantId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="意见" required>
          <ElInput v-model="commentForm.opinion" :rows="4" type="textarea" />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="commentForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="commentForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="commentForm.remarks" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>

      <ElTable :data="participantOptions" border max-height="220" size="small">
        <ElTableColumn label="姓名" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.participantName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="角色" min-width="100">
          <template #default="{ row }">
            {{ formatNullable(row.participantRole) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="意见" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.opinion) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="填写人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.draftedByName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="填写时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.commentedAt) }}
          </template>
        </ElTableColumn>
      </ElTable>

      <template #footer>
        <ElButton @click="commentDialogVisible = false">取消</ElButton>
        <ElButton :loading="operating" type="primary" @click="submitComment">
          保存意见
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="completeDialogVisible" title="完成会诊" width="560px">
      <ElForm label-width="96px">
        <ElFormItem label="会诊ID">
          <ElInput v-model="completeForm.consultationId" disabled />
        </ElFormItem>
        <ElFormItem label="主持意见" required>
          <ElInput v-model="completeForm.opinion" :rows="4" type="textarea" />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="completeForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="completeForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="completeForm.remarks" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="completeDialogVisible = false">取消</ElButton>
        <ElButton :loading="operating" type="success" @click="submitComplete">
          完成会诊
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
