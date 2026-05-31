<script setup lang="ts">
import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import TrackingSpecimenLatestRegistrationResult from '../components/TrackingSpecimenLatestRegistrationResult.vue';
import TrackingSpecimenListTable from '../components/TrackingSpecimenListTable.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { useTrackingSpecimenListPage } from '../composables/useTrackingSpecimenListPage';
import {
  formatCurrentNode,
  formatDateTime,
  formatFixationStatus,
  formatLabelPrintStatus,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
  formatSpecimenStatus,
} from '../utils/format';
import { formatContainerRatio } from '../utils/tracking-specimen-list';

const props = withDefaults(
  defineProps<{
    initialBarcode?: string;
    triggerKey?: number;
  }>(),
  {
    initialBarcode: '',
    triggerKey: 0,
  },
);

const {
  abnormalFilterOptions,
  detailAbnormalSpecimens,
  detailApplicationDetail,
  detailLatestRegisterResult,
  detailLoading,
  detailRow,
  detailVisible,
  filters,
  handleDepartmentChange,
  handlePageChange,
  handleQuickFilterChange,
  handleReset,
  handleSearch,
  handleSizeChange,
  items,
  labelPrintStatusOptions,
  listLoading,
  openDetailDialog,
  pageError,
  quickFilter,
  quickFilterOptions,
  specimenStatusOptions,
  summary,
  total,
} = useTrackingSpecimenListPage(props);
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElAlert
      v-if="pageError"
      :closable="false"
      :title="pageError"
      type="error"
      show-icon
    />

    <WorkflowSectionCard
      title="工作台概览"
      description="展示快捷筛选和状态统计。"
    >
      <div class="flex flex-wrap gap-2">
        <ElButton
          v-for="option in quickFilterOptions"
          :key="option.key"
          :plain="quickFilter !== option.key"
          :type="quickFilter === option.key ? 'primary' : 'default'"
          @click="handleQuickFilterChange(option.key)"
        >
          {{ option.label }}
        </ElButton>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">总数</div>
          <div class="mt-2 text-2xl font-semibold text-foreground">
            {{ summary.totalCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">异常</div>
          <div class="mt-2 text-2xl font-semibold text-red-500">
            {{ summary.abnormalCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">待贴签</div>
          <div class="mt-2 text-2xl font-semibold text-amber-500">
            {{ summary.pendingLabelCount }}
          </div>
        </div>
        <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">已贴签</div>
          <div class="mt-2 text-2xl font-semibold text-emerald-500">
            {{ summary.labelPrintedCount }}
          </div>
        </div>
      </div>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="筛选条件"
      description="支持按关键字、科室、状态、标签状态、异常标记和日期范围筛选。"
    >
      <ElForm label-width="92px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ElFormItem label="关键字">
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="申请单号 / 条码 / 标本编号"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.departmentId"
              placeholder="请选择送检科室"
              @change="handleDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="标本状态">
            <ElSelect
              v-model="filters.specimenStatus"
              clearable
              placeholder="请选择标本状态"
            >
              <ElOption
                v-for="option in specimenStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="标签状态">
            <ElSelect
              v-model="filters.labelPrintStatus"
              clearable
              placeholder="请选择标签状态"
            >
              <ElOption
                v-for="option in labelPrintStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="异常标记">
            <ElSelect
              v-model="filters.abnormalFlag"
              clearable
              placeholder="请选择异常标记"
            >
              <ElOption
                v-for="option in abnormalFilterOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="登记日期" class="xl:col-span-2">
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
        </div>

        <div class="flex justify-end gap-2">
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
        </div>
      </ElForm>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="标本列表"
      description="列表展示标本编号、条码、关联申请单、患者、科室、登记时间、标签状态和异常标记。"
    >
      <TrackingSpecimenListTable
        :items="items"
        :loading="listLoading"
        @detail="openDetailDialog"
      />

      <div v-if="!listLoading && total === 0" class="py-8">
        <ElEmpty description="暂无符合条件的标本" />
      </div>

      <div class="flex justify-end pt-4">
        <ElPagination
          :current-page="filters.page"
          :page-size="filters.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </WorkflowSectionCard>

    <ElDialog
      v-model="detailVisible"
      :close-on-click-modal="true"
      destroy-on-close
      title="标本追踪详情"
      width="1120px"
    >
      <div v-loading="detailLoading" class="flex flex-col gap-4">
        <ElAlert
          v-if="detailRow?.abnormalFlag"
          :closable="false"
          title="该标本当前处于异常状态。"
          type="warning"
          show-icon
        />
        <WorkflowSectionCard
          v-if="detailAbnormalSpecimens.length > 0"
          title="异常明细"
          description="展示当前异常标本的退回/拒收结果、质控结论、问题代码和原因。"
        >
          <div class="flex flex-col gap-3">
            <div
              v-for="specimen in detailAbnormalSpecimens"
              :key="`${specimen.id}-${specimen.barcode}`"
              class="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm"
            >
              <div class="font-medium text-foreground">
                {{ specimen.specimenNo || '-' }} / {{ specimen.barcode || '-' }}
              </div>
              <div class="mt-2 grid gap-2 md:grid-cols-2">
                <div>异常类型：{{ formatReceiptStatus(specimen.status) }}</div>
                <div>
                  质控结果：{{
                    formatQualityCheckResult(specimen.qualityCheckResult)
                  }}
                </div>
                <div>
                  问题代码：{{
                    specimen.qualityIssueCodes.length > 0
                      ? specimen.qualityIssueCodes.join('、')
                      : '-'
                  }}
                </div>
                <div>原因：{{ specimen.reason || '-' }}</div>
              </div>
            </div>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="标本基础信息"
          description="展示标本、条码、容器、状态与最近批次信息。"
        >
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="标本编号">
              {{ detailRow?.specimenNo || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="条码">
              {{ detailRow?.barcode || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本名称">
              {{ detailRow?.specimenName || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本类型">
              {{ formatNullable(detailRow?.specimenType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="采集部位">
              {{ formatNullable(detailRow?.specimenSite) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器名称">
              {{ formatNullable(detailRow?.containerName) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="容器数/标本数">
              {{ detailRow ? formatContainerRatio(detailRow) : '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标签状态">
              {{ formatLabelPrintStatus(detailRow?.labelPrintStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="标本状态">
              {{ formatSpecimenStatus(detailRow?.specimenStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="核验状态">
              {{ formatFixationStatus(detailRow?.fixationStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="登记时间">
              {{ formatDateTime(detailRow?.registeredAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="最近标签批次">
              {{ formatNullable(detailRow?.labelPrintBatchNo) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="所属申请单信息"
          description="展示关联申请单的患者、科室、节点和临床诊断。"
        >
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="申请单号">
              {{
                formatNullable(
                  detailApplicationDetail?.applicationNo ??
                    detailRow?.applicationNo,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者姓名">
              {{
                formatNullable(
                  detailApplicationDetail?.patientName ??
                    detailRow?.patientName,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="送检科室">
              {{
                formatNullable(
                  detailApplicationDetail?.submittingDepartmentName ??
                    detailRow?.submittingDepartmentName,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前节点">
              {{ formatCurrentNode(detailApplicationDetail?.currentNode) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="临床诊断">
              {{ formatNullable(detailApplicationDetail?.clinicalDiagnosis) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="最近流程节点"
          description="展示最近追踪事件和操作上下文。"
        >
          <ElTimeline v-if="detailApplicationDetail?.recentEvents?.length">
            <ElTimelineItem
              v-for="(event, index) in detailApplicationDetail.recentEvents
                .slice(-6)
                .reverse()"
              :key="`${event.eventTime}-${event.nodeCode}-${index}`"
              :timestamp="formatDateTime(event.eventTime)"
            >
              <div class="font-medium text-foreground">
                {{ formatCurrentNode(event.nodeCode) }} /
                {{ formatNullable(event.eventType) }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ formatNullable(event.operatorName) }}
              </div>
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="暂无流程节点记录" />
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="最近标签批次结果"
          description="展示当前申请单最近一次登记批次及其标本结果。"
        >
          <TrackingSpecimenLatestRegistrationResult
            :result="detailLatestRegisterResult"
          />
        </WorkflowSectionCard>
      </div>
    </ElDialog>
  </div>
</template>
