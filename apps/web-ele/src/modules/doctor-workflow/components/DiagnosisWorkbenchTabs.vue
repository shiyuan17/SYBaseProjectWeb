<script setup lang="ts">
import type { DiagnosticWorkbenchView } from '../types/doctor-workflow';

import { ref, watch } from 'vue';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTabPane,
  ElTable,
  ElTableColumn,
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

const activeTab = ref('diagnosis');

watch(
  () => props.workbench?.caseId,
  () => {
    activeTab.value = 'diagnosis';
  },
);
</script>

<template>
  <section class="rounded-lg border border-border bg-card shadow-sm">
    <header class="border-b border-border px-4 py-3">
      <h3 class="text-sm font-semibold text-foreground">诊断工作区</h3>
      <p class="mt-1 text-xs text-muted-foreground">
        右侧聚合展示当前病例的诊断摘要、材料信息、医嘱与流程痕迹。
      </p>
    </header>

    <div class="px-4 py-3">
      <ElEmpty v-if="!workbench" description="请先从左侧选择一个病例" />

      <ElTabs
        v-else
        v-model="activeTab"
        class="diagnosis-workbench-tabs"
        data-testid="diagnosis-workbench-tabs"
      >
        <ElTabPane label="诊断" name="diagnosis">
          <div class="grid gap-3 lg:grid-cols-2">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">报告状态</h4>
              <div class="mt-2 text-sm text-muted-foreground">
                当前报告状态：{{
                  formatReportStatus(workbench.currentReport?.reportStatus)
                }}
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                报告号：{{ formatNullable(workbench.currentReport?.reportNo) }}
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                版本：v{{ workbench.currentReport?.versionNo ?? 1 }}
              </div>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">临床与诊断摘要</h4>
              <div class="mt-2 text-sm text-muted-foreground">临床诊断</div>
              <div class="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {{ formatNullable(workbench.clinicalDiagnosis) }}
              </div>
              <div class="mt-3 text-sm text-muted-foreground">当前最终诊断</div>
              <div class="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {{ formatNullable(workbench.currentReport?.finalDiagnosis) }}
              </div>
            </article>
          </div>

          <div class="mt-3 grid gap-3 lg:grid-cols-2">
            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">大体所见预览</h4>
              <div class="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {{ formatNullable(workbench.currentReport?.grossExam) }}
              </div>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">镜检所见预览</h4>
              <div class="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {{ formatNullable(workbench.currentReport?.microscopicExam) }}
              </div>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="进度" name="progress">
          <div class="grid gap-3 xl:grid-cols-2">
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
              </ElTable>
            </article>

            <article class="rounded-md border border-border bg-background p-3">
              <h4 class="text-sm font-medium text-foreground">报告痕迹</h4>
              <ElTable
                :data="workbench.recentEvents"
                border
                class="mt-3"
                size="small"
              >
                <ElTableColumn label="节点" min-width="120" prop="nodeCode" />
                <ElTableColumn label="事件" min-width="120" prop="eventType" />
                <ElTableColumn label="状态" min-width="100" prop="eventStatus" />
                <ElTableColumn label="时间" min-width="160">
                  <template #default="{ row }">
                    {{ formatDateTime(row.eventTime) }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </article>
          </div>
        </ElTabPane>

        <ElTabPane label="大体所见" name="gross-exam">
          <article class="rounded-md border border-border bg-background p-3">
            <div class="whitespace-pre-wrap text-sm text-foreground">
              {{ formatNullable(workbench.currentReport?.grossExam) }}
            </div>
          </article>
        </ElTabPane>

        <ElTabPane label="镜检所见" name="microscopic-exam">
          <article class="rounded-md border border-border bg-background p-3">
            <div class="whitespace-pre-wrap text-sm text-foreground">
              {{ formatNullable(workbench.currentReport?.microscopicExam) }}
            </div>
          </article>
        </ElTabPane>

        <ElTabPane label="标本" name="specimens">
          <ElTable :data="workbench.specimens" border size="small">
            <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
            <ElTableColumn label="条码" min-width="140" prop="barcode" />
            <ElTableColumn label="标本名称" min-width="180" prop="specimenName" />
            <ElTableColumn label="状态" min-width="120" prop="specimenStatus" />
          </ElTable>
        </ElTabPane>

        <ElTabPane label="蜡块" name="blocks">
          <ElTable :data="workbench.blocks" border size="small">
            <ElTableColumn label="蜡块号" min-width="140" prop="blockCode" />
            <ElTableColumn label="包埋盒" min-width="140" prop="embeddingBoxNo" />
            <ElTableColumn label="归档位置" min-width="160" prop="archiveLocation" />
            <ElTableColumn label="借阅状态" min-width="120" prop="loanStatus" />
          </ElTable>
        </ElTabPane>

        <ElTabPane label="玻片" name="slides">
          <ElTable :data="workbench.slides" border size="small">
            <ElTableColumn label="玻片号" min-width="140" prop="slideNo" />
            <ElTableColumn label="状态" min-width="120" prop="slideStatus" />
            <ElTableColumn label="质控" min-width="120" prop="qualityStatus" />
            <ElTableColumn label="归档位置" min-width="160" prop="archiveLocation" />
          </ElTable>
        </ElTabPane>

        <ElTabPane label="特检医嘱" name="medical-orders">
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
            <ElTableColumn label="内容" min-width="220" prop="orderContent" />
            <ElTableColumn label="开嘱医生" min-width="140" prop="doctorName" />
          </ElTable>
        </ElTabPane>

        <ElTabPane label="报告痕迹" name="report-traces">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="报告号">
              {{ formatNullable(workbench.currentReport?.reportNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前状态">
              {{ formatReportStatus(workbench.currentReport?.reportStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{ formatNullable(workbench.submittingDepartmentName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检医生">
              {{ formatNullable(workbench.submittingDoctorName) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElTable
            :data="workbench.recentEvents"
            border
            class="mt-3"
            size="small"
          >
            <ElTableColumn label="节点" min-width="120" prop="nodeCode" />
            <ElTableColumn label="事件" min-width="120" prop="eventType" />
            <ElTableColumn label="时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.eventTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="内容" min-width="220" prop="eventContent" />
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </div>
  </section>
</template>
