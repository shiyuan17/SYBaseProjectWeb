<script setup lang="ts">
import type {
  HistoricalImportJobQuery,
  HistoricalReportQuery,
  ImportHistoricalReportsRequest,
} from '../types/m6-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

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

import WorkflowSectionCard from '#/modules/doctor-workflow/components/WorkflowSectionCard.vue';

import {
  importHistoricalReports,
  listHistoricalImportJobs,
  listHistoricalReports,
} from '../api/m6-management-service';
import { getHistoryManagementCapabilities } from '../access';

const accessStore = useAccessStore();
const userStore = useUserStore();

const capabilities = computed(() =>
  getHistoryManagementCapabilities(accessStore.accessCodes),
);

const loading = ref(false);
const importLoading = ref(false);
const pageError = ref('');
const jobs = ref([] as Awaited<ReturnType<typeof listHistoricalImportJobs>>);
const reports = ref([] as Awaited<ReturnType<typeof listHistoricalReports>>);

const importForm = reactive<ImportHistoricalReportsRequest>({
  applicationNo: '',
  from: '',
  operatorName: '',
  operatorUserId: '',
  pathologyNo: '',
  patientId: '',
  remarks: '',
  sourceSystem: '',
  to: '',
});

const jobQueryForm = reactive<HistoricalImportJobQuery>({
  applicationNo: '',
  importStatus: '',
  pathologyNo: '',
  patientId: '',
  sourceSystem: '',
});

const reportQueryForm = reactive<HistoricalReportQuery>({
  applicationNo: '',
  externalReportNo: '',
  from: '',
  pathologyNo: '',
  patientId: '',
  sourceSystem: '',
  to: '',
});

function displayText(value?: null | string) {
  return value?.trim() ? value : '-';
}

async function loadHistoryData() {
  loading.value = true;
  pageError.value = '';
  try {
    const [jobResult, reportResult] = await Promise.all([
      listHistoricalImportJobs({
        applicationNo: jobQueryForm.applicationNo?.trim() || undefined,
        importStatus: jobQueryForm.importStatus?.trim() || undefined,
        pathologyNo: jobQueryForm.pathologyNo?.trim() || undefined,
        patientId: jobQueryForm.patientId?.trim() || undefined,
        sourceSystem: jobQueryForm.sourceSystem?.trim() || undefined,
      }),
      listHistoricalReports({
        applicationNo: reportQueryForm.applicationNo?.trim() || undefined,
        externalReportNo: reportQueryForm.externalReportNo?.trim() || undefined,
        from: reportQueryForm.from?.trim() || undefined,
        pathologyNo: reportQueryForm.pathologyNo?.trim() || undefined,
        patientId: reportQueryForm.patientId?.trim() || undefined,
        sourceSystem: reportQueryForm.sourceSystem?.trim() || undefined,
        to: reportQueryForm.to?.trim() || undefined,
      }),
    ]);
    jobs.value = jobResult;
    reports.value = reportResult;
  } catch (error) {
    jobs.value = [];
    reports.value = [];
    pageError.value = error instanceof Error ? error.message : '历史报告加载失败';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  jobQueryForm.applicationNo = '';
  jobQueryForm.importStatus = '';
  jobQueryForm.pathologyNo = '';
  jobQueryForm.patientId = '';
  jobQueryForm.sourceSystem = '';
  reportQueryForm.applicationNo = '';
  reportQueryForm.externalReportNo = '';
  reportQueryForm.from = '';
  reportQueryForm.pathologyNo = '';
  reportQueryForm.patientId = '';
  reportQueryForm.sourceSystem = '';
  reportQueryForm.to = '';
  void loadHistoryData();
}

async function handleImport() {
  importLoading.value = true;
  try {
    await importHistoricalReports({
      applicationNo: importForm.applicationNo?.trim() || undefined,
      from: importForm.from?.trim() || undefined,
      operatorName: importForm.operatorName?.trim() || undefined,
      operatorUserId: importForm.operatorUserId?.trim() || undefined,
      pathologyNo: importForm.pathologyNo?.trim() || undefined,
      patientId: importForm.patientId?.trim() || undefined,
      remarks: importForm.remarks?.trim() || undefined,
      sourceSystem: importForm.sourceSystem?.trim() || undefined,
      to: importForm.to?.trim() || undefined,
    });
    ElMessage.success('历史报告导入任务已创建');
    await loadHistoryData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '历史报告导入失败');
  } finally {
    importLoading.value = false;
  }
}

watch(
  () => [userStore.userInfo?.realName, userStore.userInfo?.userId],
  ([realName, userId]) => {
    if (!importForm.operatorName) {
      importForm.operatorName = realName ?? '';
    }
    if (!importForm.operatorUserId) {
      importForm.operatorUserId = userId ?? '';
    }
  },
  { immediate: true },
);

onMounted(() => {
  void loadHistoryData();
});
</script>

<template>
  <Page
    title="历史报告"
    description="发起历史报告导入任务，并查询导入作业与历史报告结果。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="导入任务"
        description="基于来源系统、患者、病理号和时间范围创建历史导入任务。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="来源系统">
            <ElInput v-model="importForm.sourceSystem" placeholder="如 MOCK_HIS" />
          </ElFormItem>
          <ElFormItem label="患者 ID">
            <ElInput v-model="importForm.patientId" />
          </ElFormItem>
          <ElFormItem label="病理号">
            <ElInput v-model="importForm.pathologyNo" />
          </ElFormItem>
          <ElFormItem label="申请单号">
            <ElInput v-model="importForm.applicationNo" />
          </ElFormItem>
          <ElFormItem label="起始时间">
            <ElInput v-model="importForm.from" placeholder="YYYY-MM-DDTHH:mm:ss" />
          </ElFormItem>
          <ElFormItem label="结束时间">
            <ElInput v-model="importForm.to" placeholder="YYYY-MM-DDTHH:mm:ss" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="importForm.operatorName" />
          </ElFormItem>
          <ElFormItem label="操作人 ID">
            <ElInput v-model="importForm.operatorUserId" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="importForm.remarks" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              v-if="capabilities.canImportHistory"
              :loading="importLoading"
              type="primary"
              @click="handleImport"
            >
              发起导入
            </ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="查询条件"
        description="分别筛选历史导入任务和已入库历史报告。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="任务来源系统">
            <ElInput v-model="jobQueryForm.sourceSystem" />
          </ElFormItem>
          <ElFormItem label="任务状态">
            <ElInput v-model="jobQueryForm.importStatus" placeholder="如 COMPLETED" />
          </ElFormItem>
          <ElFormItem label="任务患者 ID">
            <ElInput v-model="jobQueryForm.patientId" />
          </ElFormItem>
          <ElFormItem label="任务病理号">
            <ElInput v-model="jobQueryForm.pathologyNo" />
          </ElFormItem>
          <ElFormItem label="任务申请单号">
            <ElInput v-model="jobQueryForm.applicationNo" />
          </ElFormItem>
          <ElFormItem label="报告来源系统">
            <ElInput v-model="reportQueryForm.sourceSystem" />
          </ElFormItem>
          <ElFormItem label="报告患者 ID">
            <ElInput v-model="reportQueryForm.patientId" />
          </ElFormItem>
          <ElFormItem label="报告病理号">
            <ElInput v-model="reportQueryForm.pathologyNo" />
          </ElFormItem>
          <ElFormItem label="外部报告号">
            <ElInput v-model="reportQueryForm.externalReportNo" />
          </ElFormItem>
          <ElFormItem label="报告开始时间">
            <ElInput v-model="reportQueryForm.from" placeholder="YYYY-MM-DDTHH:mm:ss" />
          </ElFormItem>
          <ElFormItem label="报告结束时间">
            <ElInput v-model="reportQueryForm.to" placeholder="YYYY-MM-DDTHH:mm:ss" />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadHistoryData">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="导入作业"
        :description="`当前返回 ${jobs.length} 条导入任务。`"
      >
        <ElEmpty v-if="!loading && jobs.length === 0 && !pageError" description="暂无导入任务" />
        <ElTable v-else v-loading="loading" :data="jobs" border>
          <ElTableColumn label="作业 ID" min-width="180" prop="id" />
          <ElTableColumn label="来源系统" min-width="120" prop="sourceSystem" />
          <ElTableColumn label="导入状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.importStatus === 'COMPLETED' ? 'success' : row.importStatus === 'FAILED' ? 'danger' : 'warning'">
                {{ displayText(row.importStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="总数" min-width="80" prop="totalCount" />
          <ElTableColumn label="成功" min-width="80" prop="successCount" />
          <ElTableColumn label="失败" min-width="80" prop="failureCount" />
          <ElTableColumn label="补偿状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.compensationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对账状态" min-width="120">
            <template #default="{ row }">
              {{ displayText(row.reconciliationStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="错误信息" min-width="220">
            <template #default="{ row }">
              {{ displayText(row.lastErrorMessage || row.taskLastErrorMessage) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="历史报告"
        :description="`当前返回 ${reports.length} 条历史报告。`"
      >
        <ElEmpty v-if="!loading && reports.length === 0 && !pageError" description="暂无历史报告" />
        <ElTable v-else v-loading="loading" :data="reports" border>
          <ElTableColumn label="历史报告 ID" min-width="180" prop="id" />
          <ElTableColumn label="来源系统" min-width="120" prop="sourceSystem" />
          <ElTableColumn label="外部报告号" min-width="160" prop="externalReportNo" />
          <ElTableColumn label="患者" min-width="120" prop="patientName" />
          <ElTableColumn label="病理号" min-width="140" prop="pathologyNo" />
          <ElTableColumn label="报告日期" min-width="160">
            <template #default="{ row }">
              {{ displayText(row.reportDate) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="最终诊断" min-width="220">
            <template #default="{ row }">
              {{ displayText(row.finalDiagnosis) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="报告摘要" min-width="260">
            <template #default="{ row }">
              {{ displayText(row.reportSummary) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="版本数" min-width="90">
            <template #default="{ row }">
              {{ row.versions.length }}
            </template>
          </ElTableColumn>
        </ElTable>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
