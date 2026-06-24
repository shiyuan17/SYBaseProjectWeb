<script setup lang="ts">
import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

import { computed, ref, watch } from 'vue';

import { ElEmpty, ElTabPane, ElTabs, ElTag } from 'element-plus';

import { formatDateTime, formatNullable } from '../utils/format';

type StageStatus = 'completed' | 'pending';

interface StageDetail {
  label: string;
  value: string;
}

interface ClinicalSubmissionStage {
  details: StageDetail[];
  eventDevices: string;
  eventIps: string;
  eventTime: string;
  key: string;
  status: StageStatus;
  title: string;
}

type StageDefinition = {
  buildDetails: (specimen: SpecimenTrackingSummary) => StageDetail[];
  hasBusinessValue: (specimen: SpecimenTrackingSummary) => boolean;
  key: string;
  matchesEvent: (event: TrackingEventView) => boolean;
  title: string;
};

const props = withDefaults(
  defineProps<{
    applicationNo?: null | string;
    applicationRemovalAt?: null | string;
    events?: TrackingEventView[];
    patientId?: null | string;
    patientName?: null | string;
    specimens?: SpecimenTrackingSummary[];
  }>(),
  {
    applicationNo: null,
    applicationRemovalAt: null,
    events: () => [],
    patientId: null,
    patientName: null,
    specimens: () => [],
  },
);

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function hasText(value?: null | string) {
  return Boolean(normalizeText(value));
}

function joinUnique(values: Array<null | string | undefined>) {
  const uniqueValues = values
    .map((value) => normalizeText(value))
    .filter((value, index, array) => value && array.indexOf(value) === index);

  return uniqueValues.length > 0 ? uniqueValues.join('、') : '-';
}

function normalizeCode(value?: null | string) {
  return normalizeText(value).toUpperCase();
}

function isNode(event: TrackingEventView, nodeCodes: string[]) {
  return nodeCodes.includes(normalizeCode(event.nodeCode));
}

function isEventType(event: TrackingEventView, eventTypes: string[]) {
  return eventTypes.includes(normalizeCode(event.eventType));
}

function getSpecimenLabel(specimen: SpecimenTrackingSummary) {
  return (
    normalizeText(specimen.specimenNo) ||
    normalizeText(specimen.barcode) ||
    specimen.id
  );
}

function getSpecimenTabName(specimen: SpecimenTrackingSummary, index: number) {
  return specimen.id || `${getSpecimenLabel(specimen)}-${index}`;
}

function getBarcodeBindingText(specimen: SpecimenTrackingSummary) {
  const specimenNo = normalizeText(specimen.specimenNo);
  const barcode = normalizeText(specimen.barcode);
  if (specimenNo && barcode) {
    return `${specimenNo}-${barcode}`;
  }
  return specimenNo || barcode || '-';
}

function createDetail(
  label: string,
  value?: null | string,
  formatValue: (value?: null | string) => string = formatNullable,
) {
  return {
    label,
    value: formatValue(value),
  };
}

function matchesSpecimenEvent(
  event: TrackingEventView,
  specimen: SpecimenTrackingSummary,
) {
  const eventSpecimenId = normalizeText(event.specimenId);
  const eventSpecimenNo = normalizeText(event.specimenNo);
  const eventSpecimenBarcode = normalizeText(event.specimenBarcode);

  return (
    (eventSpecimenId && eventSpecimenId === specimen.id) ||
    (eventSpecimenNo &&
      eventSpecimenNo === normalizeText(specimen.specimenNo)) ||
    (eventSpecimenBarcode &&
      eventSpecimenBarcode === normalizeText(specimen.barcode))
  );
}

function isUnboundSpecimenEvent(event: TrackingEventView) {
  return (
    !hasText(event.specimenId) &&
    !hasText(event.specimenNo) &&
    !hasText(event.specimenBarcode)
  );
}

const stageDefinitions = computed<StageDefinition[]>(() => [
  {
    buildDetails: (specimen) => [
      { label: '申请单号', value: formatNullable(props.applicationNo) },
      { label: '姓名', value: formatNullable(props.patientName) },
      { label: '患者ID', value: formatNullable(props.patientId) },
      { label: '条码绑定', value: getBarcodeBindingText(specimen) },
    ],
    hasBusinessValue: () => true,
    key: 'collection',
    matchesEvent: (event) =>
      isNode(event, [
        'SPECIMEN_COLLECTION',
        'SPECIMEN_REGISTER',
        'SPECIMEN_REGISTRATION',
      ]) || isEventType(event, ['REGISTER', 'REGISTERED']),
    title: '标本采集',
  },
  {
    buildDetails: (specimen) => [
      createDetail(
        '离体时间',
        specimen.specimenRemovalAt ?? props.applicationRemovalAt,
        formatDateTime,
      ),
    ],
    hasBusinessValue: (specimen) =>
      hasText(specimen.specimenRemovalAt) ||
      hasText(props.applicationRemovalAt),
    key: 'removal',
    matchesEvent: (event) =>
      isNode(event, ['REMOVAL', 'SPECIMEN_REMOVAL']) ||
      isEventType(event, ['REMOVAL_CONFIRMED']),
    title: '离体确认',
  },
  {
    buildDetails: (specimen) => [
      createDetail('固定液类型', specimen.fixationLiquidType),
      createDetail('固定时间', specimen.fixationCompletedAt, formatDateTime),
      createDetail('固定人', specimen.fixationOperatorName),
    ],
    hasBusinessValue: (specimen) => hasText(specimen.fixationCompletedAt),
    key: 'fixation',
    matchesEvent: (event) => isNode(event, ['FIXATION', 'SPECIMEN_FIXATION']),
    title: '标本固定',
  },
  {
    buildDetails: (specimen) => [
      createDetail('确认时间', specimen.specimenConfirmedAt, formatDateTime),
      createDetail('确认人', specimen.verifiedByName),
    ],
    hasBusinessValue: (specimen) => hasText(specimen.specimenConfirmedAt),
    key: 'confirmation',
    matchesEvent: (event) =>
      isNode(event, [
        'CONFIRMATION',
        'SPECIMEN_CONFIRMATION',
        'VERIFICATION',
      ]) || isEventType(event, ['VERIFIED']),
    title: '标本确认',
  },
  {
    buildDetails: (specimen) => [
      createDetail('入库时间', specimen.checkedInAt, formatDateTime),
      createDetail('入库人', specimen.checkedInByName),
    ],
    hasBusinessValue: (specimen) => hasText(specimen.checkedInAt),
    key: 'check-in',
    matchesEvent: (event) =>
      isNode(event, ['CHECK_IN', 'SPECIMEN_CHECK_IN']) ||
      isEventType(event, ['CHECKED_IN']),
    title: '标本入库',
  },
  {
    buildDetails: (specimen) => [
      createDetail('出库时间', specimen.outboundAt, formatDateTime),
      createDetail('出库人', specimen.outboundUserName),
    ],
    hasBusinessValue: (specimen) => hasText(specimen.outboundAt),
    key: 'outbound',
    matchesEvent: (event) =>
      (isNode(event, ['TRANSPORT', 'TRANSPORT_HANDOVER']) &&
        isEventType(event, ['HANDED_OVER'])) ||
      isNode(event, ['SPECIMEN_OUTBOUND']),
    title: '标本出库',
  },
]);

function getStageEvents(
  stage: StageDefinition,
  specimen: SpecimenTrackingSummary,
) {
  const stageEvents = props.events.filter((event) => stage.matchesEvent(event));
  const specimenEvents = stageEvents.filter((event) =>
    matchesSpecimenEvent(event, specimen),
  );
  if (specimenEvents.length > 0) {
    return specimenEvents;
  }
  return props.specimens.length <= 1
    ? stageEvents.filter((event) => isUnboundSpecimenEvent(event))
    : [];
}

function getStageEventTime(events: TrackingEventView[]) {
  const eventTime = [...events]
    .toReversed()
    .find((event) => hasText(event.eventTime))?.eventTime;
  return formatDateTime(eventTime);
}

function buildStages(specimen: SpecimenTrackingSummary) {
  return stageDefinitions.value.map<ClinicalSubmissionStage>((definition) => {
    const events = getStageEvents(definition, specimen);
    const status: StageStatus =
      events.some((event) => normalizeCode(event.eventStatus) === 'SUCCESS') ||
      definition.hasBusinessValue(specimen)
        ? 'completed'
        : 'pending';
    return {
      details: definition.buildDetails(specimen),
      eventDevices: joinUnique(events.map((event) => event.operatorDevice)),
      eventIps: joinUnique(events.map((event) => event.operatorIp)),
      eventTime: getStageEventTime(events),
      key: definition.key,
      status,
      title: definition.title,
    };
  });
}

const specimenTabs = computed(() =>
  props.specimens.map((specimen, index) => ({
    label: getSpecimenLabel(specimen),
    name: getSpecimenTabName(specimen, index),
    stages: buildStages(specimen),
  })),
);

const activeTabName = ref('');

watch(
  specimenTabs,
  (tabs) => {
    if (tabs.length === 0) {
      activeTabName.value = '';
      return;
    }
    if (!tabs.some((tab) => tab.name === activeTabName.value)) {
      activeTabName.value = tabs[0]?.name ?? '';
    }
  },
  { immediate: true },
);
</script>

<template>
  <section class="clinical-submission-timeline" aria-label="临床送检时间线">
    <h3 class="clinical-submission-timeline__title">临床送检</h3>

    <ElEmpty v-if="specimenTabs.length === 0" description="暂无标本时间线" />
    <ElTabs v-else v-model="activeTabName" class="clinical-submission-tabs">
      <ElTabPane
        v-for="tab in specimenTabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
      >
        <ol
          class="clinical-submission-timeline__list"
          :aria-label="`${tab.label} 临床送检阶段`"
        >
          <li
            v-for="stage in tab.stages"
            :key="stage.key"
            class="clinical-submission-timeline__item"
          >
            <div
              class="clinical-submission-timeline__marker"
              :class="{
                'clinical-submission-timeline__marker--pending':
                  stage.status === 'pending',
              }"
              aria-hidden="true"
            >
              <span>{{ stage.status === 'completed' ? '✓' : '•' }}</span>
            </div>

            <div class="clinical-submission-timeline__content">
              <div class="clinical-submission-timeline__stage-header">
                <div>
                  <h4>{{ stage.title }}</h4>
                  <time>{{ stage.eventTime }}</time>
                </div>
                <ElTag
                  effect="plain"
                  :type="stage.status === 'completed' ? 'success' : 'info'"
                >
                  {{ stage.status === 'completed' ? '成功' : '待处理' }}
                </ElTag>
              </div>

              <div class="clinical-submission-timeline__meta">
                <div>IP：{{ stage.eventIps }}</div>
                <div>浏览器信息：{{ stage.eventDevices }}</div>
              </div>

              <div class="clinical-submission-timeline__details">
                <div
                  v-for="detail in stage.details"
                  :key="`${stage.key}-${detail.label}`"
                  class="clinical-submission-timeline__detail"
                >
                  <span>{{ detail.label }}：</span>
                  <strong>{{ detail.value }}</strong>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </ElTabPane>
    </ElTabs>
  </section>
</template>

<style scoped>
.clinical-submission-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.clinical-submission-timeline__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.clinical-submission-timeline__list {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  list-style: none;
}

.clinical-submission-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  min-height: 88px;
}

.clinical-submission-timeline__item:not(:last-child)::before {
  position: absolute;
  top: 32px;
  bottom: -2px;
  left: 15px;
  width: 2px;
  content: '';
  background: var(--el-color-success);
  opacity: 0.75;
}

.clinical-submission-timeline__marker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: var(--el-color-success);
  border-radius: 999px;
}

.clinical-submission-timeline__marker--pending {
  background: var(--el-color-primary);
  box-shadow: 0 0 0 6px rgb(64 158 255 / 14%);
}

.clinical-submission-timeline__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 0 0 18px;
  border-bottom: 1px solid hsl(var(--border));
}

.clinical-submission-timeline__stage-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.clinical-submission-timeline__stage-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  color: hsl(var(--foreground));
}

.clinical-submission-timeline__stage-header time {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
}

.clinical-submission-timeline__meta,
.clinical-submission-timeline__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.clinical-submission-timeline__meta {
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
}

.clinical-submission-timeline__detail {
  min-width: 0;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.clinical-submission-timeline__detail strong {
  font-weight: 600;
  color: hsl(var(--foreground));
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .clinical-submission-timeline__meta,
  .clinical-submission-timeline__details {
    grid-template-columns: 1fr;
  }
}
</style>
