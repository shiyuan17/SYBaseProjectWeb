<script setup lang="ts">
import type { ConsultationParticipantInput } from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  commentConsultationParticipant,
  completeConsultation,
  createConsultation,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';

const accessStore = useAccessStore();

const operating = ref(false);
const participants = ref<ConsultationParticipantInput[]>([]);
const lastResult = ref<null | {
  caseId?: null | string;
  consultationId?: null | string;
  status?: null | string;
}>(null);

const canCreateConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_CREATE),
);
const canCommentConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_COMMENT),
);
const canCompleteConsultation = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.CONSULTATION_COMPLETE),
);

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

function ensureOperator(operatorName: string) {
  if (!operatorName) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

function addParticipant() {
  if (!canCreateConsultation.value) {
    ElMessage.warning('当前账号没有发起会诊权限');
    return;
  }
  if (!createForm.participantUserId || !createForm.participantName) {
    ElMessage.warning('请填写参与人 ID 和姓名');
    return;
  }
  participants.value.push({
    participantName: createForm.participantName,
    participantRole: createForm.participantRole,
    participantUserId: createForm.participantUserId,
  });
  createForm.participantName = '';
  createForm.participantRole = 'MEMBER';
  createForm.participantUserId = '';
}

function removeParticipant(index: number) {
  participants.value.splice(index, 1);
}

async function submitCreateConsultation() {
  if (!canCreateConsultation.value) {
    ElMessage.warning('当前账号没有发起会诊权限');
    return;
  }
  if (!createForm.caseId || participants.value.length === 0) {
    ElMessage.warning('请填写病例 ID 并至少添加一名参与人');
    return;
  }
  if (!ensureOperator(createForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await createConsultation({
      caseId: createForm.caseId,
      operatorName: createForm.operatorName,
      participants: participants.value,
      remarks: createForm.remarks || undefined,
      terminalCode: createForm.terminalCode || undefined,
    });
    commentForm.consultationId =
      lastResult.value.consultationId ?? commentForm.consultationId;
    completeForm.consultationId =
      lastResult.value.consultationId ?? completeForm.consultationId;
    ElMessage.success('会诊已发起');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function submitComment() {
  if (!canCommentConsultation.value) {
    ElMessage.warning('当前账号没有录入会诊意见权限');
    return;
  }
  if (
    !commentForm.consultationId ||
    !commentForm.participantId ||
    !commentForm.opinion
  ) {
    ElMessage.warning('请填写会诊 ID、参与人 ID 和意见');
    return;
  }
  if (!ensureOperator(commentForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await commentConsultationParticipant(
      commentForm.consultationId,
      commentForm.participantId,
      {
        operatorName: commentForm.operatorName,
        opinion: commentForm.opinion,
        remarks: commentForm.remarks || undefined,
        terminalCode: commentForm.terminalCode || undefined,
      },
    );
    ElMessage.success('会诊意见已保存');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function submitComplete() {
  if (!canCompleteConsultation.value) {
    ElMessage.warning('当前账号没有完成会诊权限');
    return;
  }
  if (!completeForm.consultationId || !completeForm.opinion) {
    ElMessage.warning('请填写会诊 ID 和主持意见');
    return;
  }
  if (!ensureOperator(completeForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await completeConsultation(completeForm.consultationId, {
      operatorName: completeForm.operatorName,
      opinion: completeForm.opinion,
      remarks: completeForm.remarks || undefined,
      terminalCode: completeForm.terminalCode || undefined,
    });
    ElMessage.success('会诊已完成');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}
</script>

<template>
  <Page
    title="科内会诊工作站"
    description="发起会诊、维护参与人、录入参与人意见并完成主持人总结。"
  >
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard
        v-if="canCreateConsultation"
        title="发起会诊"
        description="诊断岗可输入病例 ID 并维护参与人列表后发起会诊。"
      >
        <ElForm label-width="100px">
          <ElFormItem label="病例ID">
            <ElInput v-model="createForm.caseId" />
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
          <ElFormItem label="操作人">
            <ElInput v-model="createForm.operatorName" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="createForm.remarks" type="textarea" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="operating"
              type="primary"
              @click="submitCreateConsultation"
            >
              发起会诊
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElTable :data="participants" border>
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
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="canCommentConsultation"
        title="录入参与人意见"
        description="被邀请的会诊参与人可填写意见。"
      >
        <ElForm label-width="100px">
          <ElFormItem label="会诊ID">
            <ElInput v-model="commentForm.consultationId" />
          </ElFormItem>
          <ElFormItem label="参与人ID">
            <ElInput v-model="commentForm.participantId" />
          </ElFormItem>
          <ElFormItem label="意见">
            <ElInput v-model="commentForm.opinion" :rows="4" type="textarea" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="commentForm.operatorName" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="operating"
              type="primary"
              @click="submitComment"
            >
              保存意见
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="canCompleteConsultation"
        title="完成会诊"
        description="主持人可在汇总意见后完成会诊。"
      >
        <ElForm label-width="100px">
          <ElFormItem label="会诊ID">
            <ElInput v-model="completeForm.consultationId" />
          </ElFormItem>
          <ElFormItem label="主持意见">
            <ElInput v-model="completeForm.opinion" :rows="4" type="textarea" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="completeForm.operatorName" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="operating"
              type="success"
              @click="submitComplete"
            >
              完成会诊
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        v-if="
          !canCreateConsultation &&
          !canCommentConsultation &&
          !canCompleteConsultation
        "
        title="当前无可用操作"
      >
        <ElEmpty description="当前账号没有会诊相关权限。" />
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
            {{ formatNullable(lastResult?.status) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
