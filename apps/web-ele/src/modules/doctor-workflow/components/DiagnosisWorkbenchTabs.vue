<script setup lang="ts">
import type {
  DiagnosticWorkbenchView,
  RemarkSectionSummary,
} from '../types/doctor-workflow';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import {
  formatApplicationType,
  formatDateTime,
  formatNullable,
  formatReportStatus,
} from '../utils/format';

const props = defineProps<{
  workbench: DiagnosticWorkbenchView | null;
}>();

const activeTab = ref('patient-info');
const editableRemarkSections = ref<RemarkSectionSummary[]>([]);
const patientBrief = computed(() => {
  const workbench = props.workbench;
  if (!workbench) {
    return '';
  }

  return [workbench.patientName, workbench.patientGender, workbench.patientAge]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(',');
});

watch(
  () => props.workbench?.caseId,
  () => {
    activeTab.value = 'patient-info';
  },
);

watch(
  () => props.workbench?.remarkSections,
  (sections) => {
    editableRemarkSections.value = createEditableRemarkSections(sections ?? []);
  },
  { immediate: true },
);

function createEditableRemarkSections(sections: RemarkSectionSummary[]) {
  if (sections.length > 0) {
    return sections.map((section) => ({ ...section }));
  }

  return [
    { content: '', sectionKey: 'APPLICATION', title: '申请备注' },
    { content: '', sectionKey: 'GROSSING', title: '取材备注' },
    { content: '', sectionKey: 'DIAGNOSIS', title: '诊断备注' },
  ];
}

function saveRemarkSection() {
  ElMessage.info('当前仅支持前端编辑，暂未接入保存接口');
}
</script>

<template>
  <section class="rounded-lg border border-border bg-card shadow-sm">
    <header
      class="flex flex-col gap-2 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h3 class="text-sm font-semibold text-foreground">诊断材料区</h3>
      </div>
      <div
        v-if="workbench"
        class="flex flex-wrap gap-2 text-xs text-muted-foreground"
      >
        <span class="rounded-full bg-muted px-2 py-1">
          历史 {{ workbench.historicalPathologies.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          PACS {{ workbench.pacsExaminations.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          蜡块 {{ workbench.blocks.length }}
        </span>
        <span class="rounded-full bg-muted px-2 py-1">
          切片 {{ workbench.slides.length }}
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
        <ElTabPane label="患者信息" name="patient-info">
          <div class="space-y-3">
            <ElDescriptions
              :column="2"
              border
              class="diagnosis-patient-descriptions"
              size="small"
            >
              <ElDescriptionsItem label="病理编号">
                {{ formatNullable(workbench.pathologyNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="门诊号">
                {{ formatNullable(workbench.outpatientNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="申请科室">
                {{ formatNullable(workbench.submittingDepartmentName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="离体时间">
                {{ formatDateTime(workbench.detachedAt) }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="病人信息">
                {{ formatNullable(patientBrief) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="住院号">
                {{ formatNullable(workbench.inpatientNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="申请医生">
                {{ formatNullable(workbench.submittingDoctorName) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="固定时间">
                {{ formatDateTime(workbench.fixedAt) }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="病人ID">
                {{ formatNullable(workbench.patientId) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="检查项目">
                {{ formatNullable(workbench.checkItem) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="送检时间">
                {{ formatDateTime(workbench.deliveredAt) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="病理号">
                {{ formatNullable(workbench.pathologyNo) }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="临床诊断">
                <div class="whitespace-pre-wrap font-medium">
                  {{ formatNullable(workbench.clinicalDiagnosis) }}
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="床号">
                {{ formatNullable(workbench.bedNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="传染源">
                <span class="font-medium text-danger">
                  {{ formatNullable(workbench.infectiousSource) }}
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="手机号">
                {{ formatNullable(workbench.phone) }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="申请医嘱">
                {{ formatApplicationType(workbench.applicationType) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="检查项目与诊断">
                {{ formatNullable(workbench.checkItem) }}
              </ElDescriptionsItem>

              <ElDescriptionsItem label="病史摘要">
                <div class="whitespace-pre-wrap">
                  {{ formatNullable(workbench.clinicalHistory) }}
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="临床检查及手术所见">
                <div class="whitespace-pre-wrap">
                  {{
                    formatNullable(
                      workbench.clinicalExaminationAndSurgeryFindings,
                    )
                  }}
                </div>
              </ElDescriptionsItem>

              <ElDescriptionsItem label="要求">
                <div class="whitespace-pre-wrap">
                  {{ formatNullable(workbench.clinicalSubmissionRequirements) }}
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="传染病史和过往病史">
                <div class="line-clamp-2 whitespace-pre-wrap">
                  {{
                    formatNullable(workbench.infectiousAndPastHistorySummary)
                  }}
                </div>
              </ElDescriptionsItem>

              <ElDescriptionsItem label="报告状态">
                {{ formatReportStatus(workbench.currentReport?.reportStatus) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="申请单号">
                {{ formatNullable(workbench.applicationNo) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="病例ID">
                {{ formatNullable(workbench.caseId) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="当前最终诊断">
                {{ formatNullable(workbench.currentReport?.finalDiagnosis) }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </ElTabPane>

        <ElTabPane label="历史病理" name="historical-pathology">
          <ElTable :data="workbench.historicalPathologies" border size="small">
            <ElTableColumn label="年龄" min-width="100" prop="age" />
            <ElTableColumn label="住院号" min-width="120" prop="inpatientNo" />
            <ElTableColumn
              label="检查号"
              min-width="130"
              prop="examinationNo"
            />
            <ElTableColumn
              label="送检类型"
              min-width="110"
              prop="submissionType"
            />
            <ElTableColumn label="报告时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.reportTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="诊断" min-width="260" prop="diagnosis" />
            <template #empty>
              <ElEmpty description="暂无历史病理记录" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="PACS检查" name="pacs-examinations">
          <ElTable :data="workbench.pacsExaminations" border size="small">
            <ElTableColumn
              label="送检类型"
              min-width="110"
              prop="submissionType"
            />
            <ElTableColumn
              label="影像诊断"
              min-width="180"
              prop="imagingDiagnosis"
            />
            <ElTableColumn label="报告时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.reportTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="检查号"
              min-width="140"
              prop="examinationNo"
            />
            <ElTableColumn
              label="影像描述"
              min-width="220"
              prop="imagingDescription"
            />
            <ElTableColumn
              label="报告状态"
              min-width="110"
              prop="reportStatus"
            />
            <template #empty>
              <ElEmpty description="暂无PACS检查记录" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="报告痕迹" name="report-traces">
          <ElTable :data="workbench.reportTraces" border size="small">
            <ElTableColumn label="序号" min-width="80" prop="sequenceNo" />
            <ElTableColumn
              label="报告医师"
              min-width="120"
              prop="reportDoctorName"
            />
            <ElTableColumn label="报告时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.reportTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="报告状态"
              min-width="110"
              prop="reportStatus"
            />
            <ElTableColumn
              label="诊断信息"
              min-width="260"
              prop="diagnosisInfo"
            />
            <template #empty>
              <ElEmpty description="暂无报告痕迹" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="蜡块" name="blocks">
          <ElTable :data="workbench.blocks" border size="small">
            <ElTableColumn label="标本名称" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.specimenName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="组织" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.tissueName ?? row.description) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="蜡块号" min-width="120" prop="blockCode" />
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.remarks ?? row.description) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="取材医生"
              min-width="120"
              prop="grossingDoctorName"
            />
            <ElTableColumn
              label="包埋医生"
              min-width="120"
              prop="embeddingDoctorName"
            />
            <ElTableColumn label="蜡块使用情况" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.usageStatus ?? row.loanStatus) }}
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无蜡块记录" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="切片" name="slides">
          <ElTable :data="workbench.slides" border size="small">
            <ElTableColumn label="序号" min-width="80">
              <template #default="{ $index }">
                {{ $index + 1 }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="130">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo ?? workbench.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="蜡块号" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.blockCode ?? row.embeddingBoxId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="类型" min-width="110">
              <template #default="{ row }">
                {{ formatNullable(row.slideType ?? row.slideNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.slicedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="检查项目"
              min-width="140"
              prop="examinationItem"
            />
            <ElTableColumn label="状态" min-width="110" prop="slideStatus" />
            <ElTableColumn label="切片人" min-width="120" prop="slicedByName" />
            <ElTableColumn
              label="诊断备注"
              min-width="180"
              prop="diagnosisRemark"
            />
            <ElTableColumn label="评价" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.evaluation ?? row.qualityStatus) }}
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无切片记录" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="备注" name="remarks">
          <div class="space-y-3">
            <section
              v-for="section in editableRemarkSections"
              :key="`${section.sectionKey}-${section.relatedNo ?? ''}`"
              class="rounded-md border border-border bg-background"
            >
              <div
                class="flex items-center justify-between gap-3 border-b border-border px-3 py-2"
              >
                <h4
                  class="text-sm font-semibold"
                  :class="
                    section.sectionKey === 'MEDICAL_ORDER'
                      ? 'text-danger'
                      : 'text-foreground'
                  "
                >
                  {{
                    section.relatedNo
                      ? `${section.title}【${section.relatedNo}】`
                      : section.title
                  }}
                </h4>
                <ElButton
                  size="small"
                  type="primary"
                  @click="saveRemarkSection"
                >
                  保存
                </ElButton>
              </div>
              <ElInput
                v-model="section.content"
                :rows="2"
                class="diagnosis-remark-input"
                resize="vertical"
                type="textarea"
              />
            </section>
          </div>
        </ElTabPane>

        <ElTabPane label="收费项目" name="charge-items">
          <ElTable :data="workbench.chargeItems" border size="small">
            <ElTableColumn label="项目名称" min-width="220" prop="itemName" />
            <ElTableColumn label="收费时间" min-width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.chargedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="收费用户姓名"
              min-width="140"
              prop="chargedByName"
            />
            <template #empty>
              <ElEmpty description="暂无收费项目" />
            </template>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </div>
  </section>
</template>

<style scoped>
.diagnosis-patient-descriptions :deep(.el-descriptions__label) {
  min-width: 88px;
  white-space: nowrap;
}

.diagnosis-patient-descriptions :deep(.el-descriptions__content) {
  min-width: 120px;
  overflow-wrap: anywhere;
}

.diagnosis-remark-input :deep(.el-textarea__inner) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
</style>
