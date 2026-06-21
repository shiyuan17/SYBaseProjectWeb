<script setup lang="ts">
import type { SpecimenTrackingSummary } from '../types/specimen-workflow';
import type { SpecimenTimelineTab } from '../utils/tracking-application-list';
import type { TrackingTimelineData } from '../utils/tracking-timeline';

import {
  ElEmpty,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatTrackingEventContent,
  formatTrackingEventStatus,
  formatTrackingNodeTitle,
} from '../utils/format';

defineProps<{
  detailRecentEventsCount: number;
  modelValue: string;
  specimens?: SpecimenTrackingSummary[];
  specimenTimelineTabs: SpecimenTimelineTab[];
  trackingTimelineData: TrackingTimelineData;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const specimenDetailFields = [
  { field: 'specimenRemovalOperatorName', label: '离体操作人' },
  { field: 'specimenRemovalAt', label: '离体时间', type: 'datetime' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

const registrationDetailFields = [
  { field: 'specimenStatus', label: '登记状态' },
  { field: 'registeredByName', label: '登记人' },
  { field: 'registeredAt', label: '登记时间', type: 'datetime' },
  { field: 'specimenType', label: '送检类型' },
  { field: 'specimenName', label: '标本名称' },
  { field: 'specimenType', label: '类型' },
  { field: 'specimenSite', label: '来源部位' },
  { field: 'specimenSize', label: '标本大小' },
  { field: 'verificationStatus', label: '核对状态' },
  { field: 'registrationEvaluationItems', label: '评价' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

const verificationDetailFields = [
  { field: 'verificationStatus', label: '核对状态' },
  { field: 'verifiedByName', label: '核对人' },
  { field: 'verificationCompletedAt', label: '核对时间', type: 'datetime' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

const fixationDetailFields = [
  { field: 'fixationLiquidType', label: '标本固定液' },
  { field: 'fixationOperatorName', label: '标本固定人' },
  { field: 'fixationCompletedAt', label: '固定时间', type: 'datetime' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

const confirmationDetailFields = [
  { field: 'verifiedByName', label: '标本确认人' },
  { field: 'specimenConfirmedAt', label: '标本确认时间', type: 'datetime' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

const checkInDetailFields = [
  { field: 'checkedInByName', label: '入库操作人' },
  { field: 'checkedInAt', label: '入库时间', type: 'datetime' },
] satisfies Array<{
  field: keyof SpecimenTrackingSummary;
  label: string;
  type?: 'datetime';
}>;

type SpecimenDetailField =
  | (typeof checkInDetailFields)[number]
  | (typeof confirmationDetailFields)[number]
  | (typeof fixationDetailFields)[number]
  | (typeof registrationDetailFields)[number]
  | (typeof specimenDetailFields)[number]
  | (typeof verificationDetailFields)[number];

function formatAggregateContext(values: string[], multipleLabel: string) {
  if (values.length === 0) {
    return '-';
  }
  if (values.length === 1) {
    return values[0];
  }
  return `${multipleLabel}(${values.join('、')})`;
}

function formatEventSummary(values: string[]) {
  if (values.length === 0) {
    return '-';
  }
  return values.join('；');
}

function buildEventTitle(
  nodeCode: null | string | undefined,
  eventStatus: null | string | undefined,
) {
  return `${formatTrackingNodeTitle(nodeCode)} / ${formatTrackingEventStatus(eventStatus)}`;
}

function formatSpecimenDetailSummary(
  specimens: SpecimenTrackingSummary[] | undefined,
  specimenIds: string[],
  field: keyof SpecimenTrackingSummary,
) {
  if (!specimens?.length || specimenIds.length === 0) {
    return '-';
  }
  const valueMap = new Map(
    specimens.map((specimen) => [specimen.id, specimen]),
  );
  const values = specimenIds
    .map((specimenId) => valueMap.get(specimenId)?.[field])
    .filter(
      (value): value is number | string =>
        value !== null && value !== undefined,
    )
    .map((value) => String(value).trim())
    .filter(Boolean);
  return formatAggregateContext([...new Set(values)], '多值');
}

function formatSpecimenDateDetailSummary(
  specimens: SpecimenTrackingSummary[] | undefined,
  specimenIds: string[],
  field: keyof SpecimenTrackingSummary,
) {
  if (!specimens?.length || specimenIds.length === 0) {
    return '-';
  }
  const valueMap = new Map(
    specimens.map((specimen) => [specimen.id, specimen]),
  );
  const values = specimenIds
    .map((specimenId) => valueMap.get(specimenId)?.[field])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => formatDateTime(value));
  return formatAggregateContext([...new Set(values)], '多时间');
}

function formatSpecimenDetailField(
  specimens: SpecimenTrackingSummary[] | undefined,
  specimenIds: string[],
  field: SpecimenDetailField,
) {
  return field.type === 'datetime'
    ? formatSpecimenDateDetailSummary(specimens, specimenIds, field.field)
    : formatSpecimenDetailSummary(specimens, specimenIds, field.field);
}

function normalizeEventCode(value: null | string | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

function resolveEventDetailFields(
  nodeCode: null | string | undefined,
  eventType: null | string | undefined,
): SpecimenDetailField[] {
  const normalizedNodeCode = normalizeEventCode(nodeCode);
  const normalizedEventType = normalizeEventCode(eventType);

  if (normalizedNodeCode === 'REMOVAL' && normalizedEventType === 'COMPLETED') {
    return [...specimenDetailFields];
  }
  if (
    [
      'SPECIMEN_COLLECTION',
      'SPECIMEN_REGISTER',
      'SPECIMEN_REGISTRATION',
    ].includes(normalizedNodeCode) &&
    normalizedEventType === 'REGISTERED'
  ) {
    return [...registrationDetailFields];
  }
  if (
    normalizedNodeCode === 'VERIFICATION' &&
    ['COMPLETED', 'VERIFIED', 'VERIFYING'].includes(normalizedEventType)
  ) {
    return [...verificationDetailFields];
  }
  if (
    normalizedNodeCode === 'FIXATION' &&
    ['COMPLETE', 'COMPLETED', 'START', 'STARTED'].includes(normalizedEventType)
  ) {
    return [...fixationDetailFields];
  }
  if (
    normalizedNodeCode === 'CONFIRMATION' &&
    normalizedEventType === 'COMPLETED'
  ) {
    return [...confirmationDetailFields];
  }
  if (
    normalizedNodeCode === 'CHECK_IN' &&
    normalizedEventType === 'CHECKED_IN'
  ) {
    return [...checkInDetailFields];
  }
  return [];
}
</script>

<template>
  <ElTabs
    v-if="detailRecentEventsCount > 0"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <ElTabPane label="总时间线" name="overall">
      <ElTimeline>
        <ElTimelineItem
          v-for="group in trackingTimelineData.overallTimelineGroups"
          :key="group.key"
          hide-timestamp
        >
          <div
            class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
          >
            <div class="mb-3 font-medium text-foreground">
              {{ buildEventTitle(group.nodeCode, group.eventStatus) }}
            </div>
            <dl class="grid gap-2 text-sm">
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">时间</dt>
                <dd class="text-foreground">
                  {{ formatDateTime(group.eventTime) }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">操作人</dt>
                <dd class="text-foreground">
                  {{ formatAggregateContext(group.operatorNames, '多操作人') }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">IP</dt>
                <dd class="text-foreground">
                  {{ formatAggregateContext(group.operatorIps, '多IP') }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">设备</dt>
                <dd
                  class="truncate text-foreground"
                  :title="
                    formatAggregateContext(group.operatorDevices, '多设备')
                  "
                >
                  {{ formatAggregateContext(group.operatorDevices, '多设备') }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">事件</dt>
                <dd class="text-foreground">
                  {{ formatEventSummary(group.eventContents) }}
                </dd>
              </div>
              <div
                v-for="field in resolveEventDetailFields(
                  group.nodeCode,
                  group.eventType,
                )"
                :key="`${group.key}-${field.field}`"
                class="grid grid-cols-[6rem_1fr] gap-x-3"
              >
                <dt class="text-muted-foreground">{{ field.label }}</dt>
                <dd class="text-foreground">
                  {{
                    formatSpecimenDetailField(
                      specimens,
                      group.specimenIds,
                      field,
                    )
                  }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">标本</dt>
                <dd class="flex flex-wrap gap-2">
                  <ElTag v-if="group.specimenCount === 0" type="info">
                    公共事件
                  </ElTag>
                  <ElTag
                    v-for="label in group.specimenLabels"
                    :key="`${group.key}-${label}`"
                    type="info"
                  >
                    {{ label }}
                  </ElTag>
                </dd>
              </div>
            </dl>
          </div>
        </ElTimelineItem>
      </ElTimeline>
    </ElTabPane>
    <ElTabPane
      v-for="specimen in specimenTimelineTabs"
      :key="specimen.id"
      :label="specimen.label"
      :name="specimen.id"
    >
      <ElTimeline v-if="specimen.events.length > 0">
        <ElTimelineItem
          v-for="(event, index) in specimen.events"
          :key="`${specimen.id}-${event.eventTime}-${event.eventType}-${index}`"
          hide-timestamp
        >
          <div
            class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
          >
            <div class="mb-3 font-medium text-foreground">
              {{ buildEventTitle(event.nodeCode, event.eventStatus) }}
            </div>
            <dl class="grid gap-2 text-sm">
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">时间</dt>
                <dd class="text-foreground">
                  {{ formatDateTime(event.eventTime) }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">操作人</dt>
                <dd class="text-foreground">
                  {{ formatNullable(event.operatorName) }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">IP</dt>
                <dd class="text-foreground">
                  {{ formatNullable(event.operatorIp) }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">设备</dt>
                <dd
                  class="truncate text-foreground"
                  :title="formatNullable(event.operatorDevice)"
                >
                  {{ formatNullable(event.operatorDevice) }}
                </dd>
              </div>
              <div class="grid grid-cols-[6rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">事件</dt>
                <dd class="text-foreground">
                  {{ formatTrackingEventContent(event) }}
                </dd>
              </div>
              <div
                v-for="field in resolveEventDetailFields(
                  event.nodeCode,
                  event.eventType,
                )"
                :key="`${specimen.id}-${event.eventTime}-${field.field}`"
                class="grid grid-cols-[6rem_1fr] gap-x-3"
              >
                <dt class="text-muted-foreground">{{ field.label }}</dt>
                <dd class="text-foreground">
                  {{
                    formatSpecimenDetailField(
                      specimens,
                      event.specimenId ? [event.specimenId] : [],
                      field,
                    )
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </ElTimelineItem>
      </ElTimeline>
      <ElEmpty v-else description="该标本暂无追踪事件" />
    </ElTabPane>
  </ElTabs>
  <ElEmpty v-else description="暂无最近追踪事件" />
</template>
