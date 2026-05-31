<script setup lang="ts">
import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { computed } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

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
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';

const props = defineProps<{
  applicationDetail: ApplicationDetailView | null;
  latestRegisterResult: LatestSpecimenRegistrationResult | null;
  loading: boolean;
  row: null | SpecimenManagementListItem;
}>();

const emit = defineEmits<{
  (event: 'goToTracking', row: SpecimenManagementListItem): void;
}>();

const visible = defineModel<boolean>({ required: true });

const detailTargetSpecimen = computed(() => {
  const specimenId = props.row?.specimenId;
  if (!specimenId) {
    return null;
  }
  return (
    props.applicationDetail?.specimens.find(
      (specimen) => specimen.id === specimenId,
    ) ??
    props.latestRegisterResult?.specimens.find(
      (specimen) => specimen.id === specimenId,
    ) ??
    null
  );
});

const detailAbnormalSpecimens = computed(() =>
  detailTargetSpecimen.value
    ? buildSpecimenAbnormalDetails([detailTargetSpecimen.value])
    : [],
);

function formatContainerRatio(row: SpecimenManagementListItem) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}
</script>

<template>
  <ElDrawer
    v-model="visible"
    :close-on-click-modal="true"
    destroy-on-close
    size="58%"
    title="标本详情"
  >
    <div v-loading="loading" class="flex flex-col gap-4">
      <ElAlert
        v-if="row?.abnormalFlag"
        :closable="false"
        title="该标本当前处于异常状态。"
        type="warning"
        show-icon
      />
      <section
        v-if="detailAbnormalSpecimens.length > 0"
        class="rounded-lg border border-warning/30 bg-warning/10 px-4 py-4"
      >
        <div class="mb-3 text-base font-semibold text-foreground">异常明细</div>
        <div class="flex flex-col gap-3">
          <div
            v-for="specimen in detailAbnormalSpecimens"
            :key="`${specimen.id}-${specimen.barcode}`"
            class="rounded-lg border border-warning/30 bg-background px-4 py-3 text-sm"
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
                问题代码：
                {{
                  specimen.qualityIssueCodes.length > 0
                    ? specimen.qualityIssueCodes.join('、')
                    : '-'
                }}
              </div>
              <div>原因：{{ specimen.reason || '-' }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">
          标本基础信息
        </div>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="标本编号">
            {{ row?.specimenNo || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="条码">
            {{ row?.barcode || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标本名称">
            {{ row?.specimenName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标本类型">
            {{ formatNullable(row?.specimenType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="采集部位">
            {{ formatNullable(row?.specimenSite) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="容器名称">
            {{ formatNullable(row?.containerName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="容器数/标本数">
            {{ row ? formatContainerRatio(row) : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标签状态">
            {{ formatLabelPrintStatus(row?.labelPrintStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标本状态">
            {{ formatSpecimenStatus(row?.specimenStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="核验状态">
            {{ formatFixationStatus(row?.fixationStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="登记时间">
            {{ formatDateTime(row?.registeredAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="2" label="最近标签批次">
            {{ formatNullable(row?.labelPrintBatchNo) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">
          所属申请单信息
        </div>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="申请单号">
            {{
              formatNullable(
                props.applicationDetail?.applicationNo ??
                  props.row?.applicationNo,
              )
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者姓名">
            {{
              formatNullable(
                props.applicationDetail?.patientName ?? props.row?.patientName,
              )
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{
              formatNullable(
                props.applicationDetail?.submittingDepartmentName ??
                  props.row?.submittingDepartmentName,
              )
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatCurrentNode(props.applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="2" label="临床诊断">
            {{ formatNullable(props.applicationDetail?.clinicalDiagnosis) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-2">
          <div class="text-base font-semibold text-foreground">
            最近流转节点
          </div>
          <ElButton
            v-if="row"
            link
            type="primary"
            @click="emit('goToTracking', row)"
          >
            去追踪与异常
          </ElButton>
        </div>

        <ElTimeline v-if="props.applicationDetail?.recentEvents?.length">
          <ElTimelineItem
            v-for="(event, index) in props.applicationDetail.recentEvents
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
              {{ formatNullable(event.eventContent) }}
            </div>
          </ElTimelineItem>
        </ElTimeline>
        <ElEmpty v-else description="暂无流转节点记录" />
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">
          最近标签批次结果
        </div>

        <template v-if="props.latestRegisterResult?.labelPrintBatchNo">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="标签批次号">
              {{ props.latestRegisterResult.labelPrintBatchNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="打印结果">
              <ElTag
                :type="
                  props.latestRegisterResult.labelPrintSuccess
                    ? 'success'
                    : 'warning'
                "
              >
                {{
                  props.latestRegisterResult.labelPrintSuccess
                    ? '成功'
                    : '存在失败'
                }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="结果说明">
              {{ formatNullable(props.latestRegisterResult.labelPrintMessage) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElTable
            :data="props.latestRegisterResult.specimens"
            border
            class="mt-4"
          >
            <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
            <ElTableColumn label="条码" min-width="180" prop="barcode" />
            <ElTableColumn
              label="标本名称"
              min-width="180"
              prop="specimenName"
            />
            <ElTableColumn label="容器名称" min-width="140">
              <template #default="{ row: latestRow }">
                {{ formatNullable(latestRow.containerName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="容器数/标本数" min-width="140">
              <template #default="{ row: latestRow }">
                {{
                  `${latestRow.containerCount ?? '-'} / ${latestRow.specimenCount ?? '-'}`
                }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="标签状态" min-width="120">
              <template #default="{ row: latestRow }">
                {{ formatLabelPrintStatus(latestRow.labelPrintStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="异常明细" min-width="320">
              <template #default="{ row: latestRow }">
                <div class="flex flex-col gap-1 text-sm">
                  <div>
                    异常类型：
                    {{
                      formatReceiptStatus(
                        latestRow.receiptStatus ?? latestRow.specimenStatus,
                      )
                    }}
                  </div>
                  <div>
                    质控结果：{{
                      formatQualityCheckResult(latestRow.qualityCheckResult)
                    }}
                  </div>
                  <div>
                    问题代码：
                    {{
                      latestRow.qualityIssueCodes?.length
                        ? latestRow.qualityIssueCodes.join('、')
                        : '-'
                    }}
                  </div>
                  <div>
                    原因：{{ formatNullable(latestRow.abnormalReason) }}
                  </div>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
        <ElEmpty v-else description="暂无最近批次结果" />
      </section>
    </div>
  </ElDrawer>
</template>
