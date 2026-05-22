<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import {
  approveReportRevisionRequest,
  createReportRevisionRequest,
  rejectReportRevisionRequest,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';

const router = useRouter();

const operating = ref(false);
const lastResult = ref<{
  approvedVersionNo?: null | number;
  caseId?: null | string;
  reportId?: null | string;
  requestId?: null | string;
  requestStatus?: null | string;
} | null>(null);

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

function ensureOperator(operatorName: string) {
  if (!operatorName) {
    ElMessage.warning('请填写操作人姓名');
    return false;
  }
  return true;
}

async function createRevision() {
  if (!createForm.reportId || !createForm.requestReason) {
    ElMessage.warning('请填写报告 ID 和修订原因');
    return;
  }
  if (!ensureOperator(createForm.operatorName)) {
    return;
  }

  operating.value = true;
  try {
    lastResult.value = await createReportRevisionRequest({
      operatorName: createForm.operatorName,
      remarks: createForm.remarks || undefined,
      reportId: createForm.reportId,
      requestReason: createForm.requestReason,
      terminalCode: createForm.terminalCode || undefined,
    });
    reviewForm.requestId = lastResult.value.requestId ?? reviewForm.requestId;
    ElMessage.success('修订申请已发起');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

async function reviewRevision(action: 'approve' | 'reject') {
  if (!reviewForm.requestId) {
    ElMessage.warning('请填写修订申请 ID');
    return;
  }
  if (!ensureOperator(reviewForm.operatorName)) {
    return;
  }
  if (action === 'reject' && !reviewForm.rejectReason) {
    ElMessage.warning('驳回修订申请需要填写驳回原因');
    return;
  }

  operating.value = true;
  try {
    const payload = {
      operatorName: reviewForm.operatorName,
      rejectReason: reviewForm.rejectReason || undefined,
      remarks: reviewForm.remarks || undefined,
      terminalCode: reviewForm.terminalCode || undefined,
    };
    lastResult.value =
      action === 'approve'
        ? await approveReportRevisionRequest(reviewForm.requestId, payload)
        : await rejectReportRevisionRequest(reviewForm.requestId, payload);
    ElMessage.success(action === 'approve' ? '修订申请已通过' : '修订申请已驳回');

    if (action === 'approve' && lastResult.value.caseId && lastResult.value.reportId) {
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
</script>

<template>
  <Page title="报告修订管理" description="对已签发或已发布报告发起修订申请，并完成审批通过或驳回。">
    <div class="flex flex-col gap-4">
      <WorkflowSectionCard title="发起修订申请">
        <ElForm label-width="100px">
          <ElFormItem label="报告ID">
            <ElInput v-model="createForm.reportId" />
          </ElFormItem>
          <ElFormItem label="修订原因">
            <ElInput v-model="createForm.requestReason" :rows="4" type="textarea" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="createForm.operatorName" />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="createForm.terminalCode" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="createForm.remarks" type="textarea" />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="operating" type="primary" @click="createRevision">
              发起修订
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="审批修订申请">
        <ElForm label-width="100px">
          <ElFormItem label="申请ID">
            <ElInput v-model="reviewForm.requestId" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="reviewForm.operatorName" />
          </ElFormItem>
          <ElFormItem label="驳回原因">
            <ElInput v-model="reviewForm.rejectReason" type="textarea" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="reviewForm.remarks" type="textarea" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="operating"
              type="success"
              @click="reviewRevision('approve')"
            >
              审批通过
            </ElButton>
            <ElButton
              :loading="operating"
              type="danger"
              @click="reviewRevision('reject')"
            >
              审批驳回
            </ElButton>
          </ElFormItem>
        </ElForm>
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
            {{ formatNullable(lastResult?.requestStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="新版本号">
            {{ formatNullable(lastResult?.approvedVersionNo) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
