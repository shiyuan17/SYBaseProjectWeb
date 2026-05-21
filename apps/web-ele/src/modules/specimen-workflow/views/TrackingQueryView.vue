<script setup lang="ts">
import type {
  ApplicationDetailView,
  TrackingQueryView as WorkflowTrackingQueryView,
} from '../types/specimen-workflow';

import { computed, ref } from 'vue';

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
  ElRadioButton,
  ElRadioGroup,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import {
  getApplicationDetail,
  getApplicationTracking,
  getSpecimenTrackingByBarcode,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDate, formatDateTime, formatNullable } from '../utils/format';

const accessStore = useAccessStore();

const pageError = ref('');
const loading = ref(false);
const detailLoading = ref(false);
const queryMode = ref<'application' | 'barcode'>('application');
const queryValue = ref('');
const trackingResult = ref<null | WorkflowTrackingQueryView>(null);
const applicationDetail = ref<null | ApplicationDetailView>(null);

const canQueryDetail = computed(() =>
  accessStore.accessCodes.includes(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);

async function submitQuery() {
  const value = queryValue.value.trim();
  if (!value) {
    ElMessage.warning(
      queryMode.value === 'application' ? '请输入申请单 ID' : '请输入标本条码',
    );
    return;
  }

  loading.value = true;
  pageError.value = '';
  applicationDetail.value = null;
  try {
    trackingResult.value =
      queryMode.value === 'application'
        ? await getApplicationTracking(value)
        : await getSpecimenTrackingByBarcode(value);
    ElMessage.success('追踪信息已更新');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadFullApplicationDetail() {
  if (!trackingResult.value) {
    ElMessage.warning('请先查询追踪信息');
    return;
  }

  detailLoading.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(trackingResult.value.id);
    ElMessage.success('完整申请单详情已加载');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    detailLoading.value = false;
  }
}
</script>

<template>
  <Page
    title="追踪查询"
    description="支持按申请单 ID 或标本条码查询送检追踪，固定展示基本信息、标本列表、时间线事件与异常标记。"
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
        title="查询入口"
        description="按申请单或按标本条码二选一查询；若具备详情权限，可进一步查看完整申请单。"
      >
        <template #extra>
          <ElButton
            v-if="canQueryDetail && trackingResult"
            :loading="detailLoading"
            @click="loadFullApplicationDetail"
          >
            查看完整申请单详情
          </ElButton>
        </template>

        <ElForm inline label-width="72px">
          <ElFormItem label="查询方式">
            <ElRadioGroup v-model="queryMode">
              <ElRadioButton label="application" value="application">申请单 ID</ElRadioButton>
              <ElRadioButton label="barcode" value="barcode">标本条码</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem :label="queryMode === 'application' ? '申请单 ID' : '标本条码'">
            <ElInput
              v-model="queryValue"
              :placeholder="
                queryMode === 'application' ? '请输入 applicationId' : '请输入 specimen barcode'
              "
              clearable
              style="width: 340px"
              @keyup.enter="submitQuery"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="submitQuery">查询</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <template v-if="trackingResult">
        <WorkflowSectionCard title="异常标记" description="用于快速识别当前申请单是否存在流程异常。">
          <ElAlert
            :closable="false"
            :title="
              trackingResult.abnormalFlag
                ? '当前申请单存在异常标记，请结合最近追踪事件和标本状态重点核对。'
                : '当前申请单未标记异常。'
            "
            :type="trackingResult.abnormalFlag ? 'warning' : 'success'"
            show-icon
          />
        </WorkflowSectionCard>

        <WorkflowSectionCard title="基本信息" description="展示申请单状态、当前节点、表单状态与送检摘要。">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单 ID">
              {{ trackingResult.id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单号">
              {{ trackingResult.applicationNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单状态">
              {{ formatNullable(trackingResult.status) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="表单状态">
              {{ formatNullable(trackingResult.applicationFormStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前节点">
              {{ formatNullable(trackingResult.currentNode) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请类型">
              {{ formatNullable(trackingResult.applicationType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{ formatNullable(trackingResult.patientName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者标识">
              {{ formatNullable(trackingResult.patientId) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{ formatNullable(trackingResult.submittingDepartmentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检医生">
              {{ formatNullable(trackingResult.submittingDoctorName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请日期">
              {{ formatDate(trackingResult.applicationDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检日期">
              {{ formatDate(trackingResult.submissionDate) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="临床诊断" :span="2">
              {{ formatNullable(trackingResult.clinicalDiagnosis) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="临床症状" :span="2">
              {{ formatNullable(trackingResult.clinicalSymptom) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="标本列表" description="展示当前申请单下标本摘要、状态和标签打印情况。">
          <ElTable :data="trackingResult.specimens" border>
            <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
            <ElTableColumn label="条码" min-width="180" prop="barcode" />
            <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
            <ElTableColumn label="标本类型" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.specimenType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标本部位" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.specimenSite) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="流程状态" min-width="140">
              <template #default="{ row }">
                <ElTag :type="row.specimenStatus === 'RECEIVED' ? 'success' : 'info'">
                  {{ formatNullable(row.specimenStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="固定状态" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.fixationStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标签状态" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.labelPrintStatus) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="时间线事件" description="展示最近追踪事件、节点、状态与操作终端。">
          <ElTimeline v-if="trackingResult.recentEvents.length > 0">
            <ElTimelineItem
              v-for="(event, index) in trackingResult.recentEvents"
              :key="`${event.eventTime}-${index}`"
              :timestamp="formatDateTime(event.eventTime)"
              placement="top"
            >
              <div class="space-y-1">
                <div class="font-medium text-foreground">
                  {{ formatNullable(event.eventType) }} / {{ formatNullable(event.eventStatus) }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ formatNullable(event.eventContent) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  节点：{{ formatNullable(event.nodeCode) }}，操作人：{{ formatNullable(event.operatorName) }}，终端：{{ formatNullable(event.sourceTerminal) }}
                </div>
              </div>
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="暂无最近追踪事件" />
        </WorkflowSectionCard>

        <WorkflowSectionCard
          v-if="applicationDetail"
          title="完整申请单详情"
          description="仅在具备详情权限时展示，便于在追踪页补充核对完整业务字段。"
        >
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="外部单号">
              {{ formatNullable(applicationDetail.externalOrderNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="来源医院">
              {{ formatNullable(applicationDetail.sourceHospitalName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="备注" :span="2">
              {{ formatNullable(applicationDetail.remarks) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="创建时间">
              {{ formatDateTime(applicationDetail.createdAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="更新时间">
              {{ formatDateTime(applicationDetail.updatedAt) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>
      </template>

      <WorkflowSectionCard
        v-else-if="!loading"
        title="查询结果"
        description="输入申请单 ID 或标本条码后即可查看追踪结果。"
      >
        <ElEmpty description="尚未执行查询" />
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
