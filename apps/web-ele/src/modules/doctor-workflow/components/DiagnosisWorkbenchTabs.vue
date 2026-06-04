<script setup lang="ts">
import type { DiagnosticWorkbenchView } from '../types/doctor-workflow';

import { ref, watch } from 'vue';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatMedicalOrderStatus,
  formatMedicalOrderType,
  formatNullable,
  formatReportStatus,
} from '../utils/format';
import { getDiagnosisTaskStatusTagType } from '../utils/workbench-view';

const props = defineProps<{
  workbench: DiagnosticWorkbenchView | null;
}>();

const activeTab = ref('report-overview');

watch(
  () => props.workbench?.caseId,
  () => {
    activeTab.value = 'report-overview';
  },
);
</script>

<template>
  <section class="rounded-lg border border-border bg-card shadow-sm">
    <header
      class="flex flex-col gap-2 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h3 class="text-sm font-semibold text-foreground">诊断资料区</h3>
        <p class="mt-1 text-xs text-muted-foreground">
          以报告书写为中心汇总临床资料、材料切片、流程痕迹、会诊修订与医嘱收费。
        </p>
      </div>
      <div
        v-if="workbench"
        class="flex flex-wrap gap-2 text-xs text-muted-foreground"
      >
        <span class="rounded-full bg-muted px-2 py-1">
          标本 {{ workbench.specimens.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          蜡块 {{ workbench.blocks.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          玻片 {{ workbench.slides.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          医嘱 {{ workbench.medicalOrders.length }}
        </span>
      </div>
    </header>

    <div class="px-4 py-3">
      <ElEmpty v-if="!workbench" description="请先从左侧选择一个病例" />

      <ElTabs
        v-else
        v-model="activeTab"
        class="diagnosis-workbench-tabs"
        data-testid="diagnosis-workbench-tabs"
      >
        <ElTabPane label="报告概览" name="report-overview">
          <div class="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)]">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">报告状态</h4>
              <div class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">报告号</span>
                  <span class="font-medium text-foreground">
                    {{ formatNullable(workbench.currentReport?.reportNo) }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">当前状态</span>
                  <span class="font-medium text-foreground">
                    {{
                      formatReportStatus(workbench.currentReport?.reportStatus)
                    }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">版本</span>
                  <span class="font-medium text-foreground">
                    v{{ workbench.currentReport?.versionNo ?? 1 }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">审核医生</span>
                  <span class="font-medium text-foreground">
                    {{ formatNullable(workbench.currentReport?.reviewerName) }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">签发医生</span>
                  <span class="font-medium text-foreground">
                    {{ formatNullable(workbench.currentReport?.signedByName) }}
                  </span>
                </div>
              </div>
            </article>

            <div class="grid gap-3 lg:grid-cols-3">
              <article
                class="rounded-md border border-border bg-background p-3"
              >
                <h4 class="text-sm font-medium text-foreground">大体所见</h4>
                <div
                  class="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-sm text-foreground"
                >
                  {{ formatNullable(workbench.currentReport?.grossExam) }}
                </div>
              </article>
              <article
                class="rounded-md border border-border bg-background p-3"
              >
                <h4 class="text-sm font-medium text-foreground">镜检所见</h4>
                <div
                  class="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-sm text-foreground"
                >
                  {{ formatNullable(workbench.currentReport?.microscopicExam) }}
                </div>
              </article>
              <article
                class="rounded-md border border-border bg-background p-3"
              >
                <h4 class="text-sm font-medium text-foreground">诊断结果</h4>
                <div
                  class="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-sm font-medium text-foreground"
                >
                  {{ formatNullable(workbench.currentReport?.finalDiagnosis) }}
                </div>
              </article>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="临床资料" name="clinical">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem label="申请单号">
                {{ formatNullable(workbench.applicationNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="病理号">
                {{ formatNullable(workbench.pathologyNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="患者姓名">
                {{ formatNullable(workbench.patientName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="病例状态">
                {{ formatNullable(workbench.caseStatus) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="送检科室">
                {{ formatNullable(workbench.submittingDepartmentName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="送检医生">
                {{ formatNullable(workbench.submittingDoctorName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="临床诊断">
                <div class="whitespace-pre-wrap">
                  {{ formatNullable(workbench.clinicalDiagnosis) }}
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="申请单影像">
                <a
                  v-if="workbench.applicationFormImageUrl"
                  :href="workbench.applicationFormImageUrl"
                  class="text-primary hover:underline"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  查看归档影像
                </a>
                <span v-else>
                  {{ formatNullable(workbench.applicationFormImageUrl) }}
                </span>
              </ElDescriptionsItem>
            </ElDescriptions>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">申请单归档</h4>
              <div class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">归档状态</span>
                  <span class="font-medium text-foreground">
                    {{ formatNullable(workbench.applicationFormArchiveStatus) }}
                  </span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-muted-foreground">归档位置</span>
                  <span class="font-medium text-foreground">
                    {{
                      formatNullable(workbench.applicationFormArchiveLocation)
                    }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="材料与切片" name="materials">
          <div class="grid gap-3 xl:grid-cols-3">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                标本 {{ workbench.specimens.length }}
              </h4>
              <ElTable
                :data="workbench.specimens"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn
                  label="标本号"
                  min-width="120"
                  prop="specimenNo"
                />
                <ElTableColumn label="条码" min-width="130" prop="barcode" />
                <ElTableColumn
                  label="标本名称"
                  min-width="160"
                  prop="specimenName"
                />
                <ElTableColumn
                  label="状态"
                  min-width="110"
                  prop="specimenStatus"
                />
                <template #empty>
                  <ElEmpty description="暂无标本记录" />
                </template>
              </ElTable>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                蜡块 {{ workbench.blocks.length }}
              </h4>
              <ElTable
                :data="workbench.blocks"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn
                  label="蜡块号"
                  min-width="120"
                  prop="blockCode"
                />
                <ElTableColumn
                  label="包埋盒"
                  min-width="130"
                  prop="embeddingBoxNo"
                />
                <ElTableColumn
                  label="说明"
                  min-width="160"
                  prop="description"
                />
                <ElTableColumn
                  label="归档位置"
                  min-width="140"
                  prop="archiveLocation"
                />
                <ElTableColumn label="借阅" min-width="100" prop="loanStatus" />
                <template #empty>
                  <ElEmpty description="暂无蜡块记录" />
                </template>
              </ElTable>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                玻片 {{ workbench.slides.length }}
              </h4>
              <ElTable
                :data="workbench.slides"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn label="玻片号" min-width="120" prop="slideNo" />
                <ElTableColumn
                  label="状态"
                  min-width="110"
                  prop="slideStatus"
                />
                <ElTableColumn
                  label="质控"
                  min-width="110"
                  prop="qualityStatus"
                />
                <ElTableColumn
                  label="归档位置"
                  min-width="140"
                  prop="archiveLocation"
                />
                <ElTableColumn label="借阅" min-width="100" prop="loanStatus" />
                <template #empty>
                  <ElEmpty description="暂无玻片记录" />
                </template>
              </ElTable>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="流程痕迹" name="workflow-traces">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">诊断任务链</h4>
              <ElTable
                :data="workbench.diagnosticTasks"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn label="任务号" min-width="150" prop="id" />
                <ElTableColumn label="类型" min-width="90">
                  <template #default="{ row }">
                    {{ formatDiagnosticTaskType(row.taskType) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="状态" min-width="110">
                  <template #default="{ row }">
                    <ElTag
                      :type="getDiagnosisTaskStatusTagType(row.taskStatus)"
                      size="small"
                    >
                      {{ formatDiagnosticTaskStatus(row.taskStatus) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="责任医生"
                  min-width="120"
                  prop="diagnosisDoctorName"
                />
                <ElTableColumn
                  label="初诊医生"
                  min-width="120"
                  prop="primaryDoctorName"
                />
                <template #empty>
                  <ElEmpty description="暂无诊断任务" />
                </template>
              </ElTable>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                报告痕迹 / 事件链
              </h4>
              <ElTable
                :data="workbench.recentEvents"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn label="节点" min-width="120" prop="nodeCode" />
                <ElTableColumn label="事件" min-width="120" prop="eventType" />
                <ElTableColumn
                  label="状态"
                  min-width="100"
                  prop="eventStatus"
                />
                <ElTableColumn
                  label="操作人"
                  min-width="120"
                  prop="operatorName"
                />
                <ElTableColumn label="时间" min-width="160">
                  <template #default="{ row }">
                    {{ formatDateTime(row.eventTime) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="内容"
                  min-width="220"
                  prop="eventContent"
                />
                <template #empty>
                  <ElEmpty description="暂无流程痕迹" />
                </template>
              </ElTable>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="会诊与修订" name="consultation-revision">
          <div class="grid gap-3 xl:grid-cols-2">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                科内会诊 {{ workbench.consultations.length }}
              </h4>
              <ElTable
                :data="workbench.consultations"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn
                  label="会诊ID"
                  min-width="150"
                  prop="consultationId"
                />
                <ElTableColumn
                  label="类型"
                  min-width="110"
                  prop="consultationType"
                />
                <ElTableColumn label="状态" min-width="110" prop="status" />
                <ElTableColumn
                  label="发起人"
                  min-width="120"
                  prop="requestedByName"
                />
                <ElTableColumn label="主持人" min-width="120" prop="hostName" />
                <ElTableColumn
                  label="参与数"
                  min-width="90"
                  prop="participantCount"
                />
                <ElTableColumn
                  label="会诊意见"
                  min-width="220"
                  prop="opinion"
                />
                <template #empty>
                  <ElEmpty description="暂无会诊记录" />
                </template>
              </ElTable>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">
                报告修订 {{ workbench.revisions.length }}
              </h4>
              <ElTable
                :data="workbench.revisions"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn
                  label="申请号"
                  min-width="150"
                  prop="requestId"
                />
                <ElTableColumn
                  label="状态"
                  min-width="110"
                  prop="requestStatus"
                />
                <ElTableColumn
                  label="当前版本"
                  min-width="100"
                  prop="currentVersionNo"
                />
                <ElTableColumn
                  label="批准版本"
                  min-width="100"
                  prop="approvedVersionNo"
                />
                <ElTableColumn
                  label="申请人"
                  min-width="120"
                  prop="requestedByName"
                />
                <ElTableColumn
                  label="审核人"
                  min-width="120"
                  prop="reviewedByName"
                />
                <ElTableColumn
                  label="修订原因"
                  min-width="220"
                  prop="requestReason"
                />
                <ElTableColumn
                  label="驳回原因"
                  min-width="220"
                  prop="rejectReason"
                />
                <template #empty>
                  <ElEmpty description="暂无修订记录" />
                </template>
              </ElTable>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="特检医嘱/收费" name="medical-orders">
          <ElTable :data="workbench.medicalOrders" border size="small">
            <ElTableColumn label="医嘱号" min-width="150" prop="orderNumber" />
            <ElTableColumn label="类型" min-width="120">
              <template #default="{ row }">
                {{ formatMedicalOrderType(row.orderType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                {{ formatMedicalOrderStatus(row.status) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="收费状态"
              min-width="120"
              prop="billingStatus"
            />
            <ElTableColumn
              label="执行范围"
              min-width="140"
              prop="executionScope"
            />
            <ElTableColumn label="开嘱医生" min-width="140" prop="doctorName" />
            <ElTableColumn label="执行人" min-width="140" prop="executorName" />
            <ElTableColumn label="医嘱时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.orderDate) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="内容" min-width="240" prop="orderContent" />
            <ElTableColumn label="备注" min-width="180" prop="remarks" />
            <template #empty>
              <ElEmpty description="暂无特检医嘱或收费记录" />
            </template>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </div>
  </section>
</template>
