<script setup lang="ts">
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
  formatTrackingEventType,
} from '../utils/format';

defineProps<{
  detailRecentEventsCount: number;
  modelValue: string;
  specimenTimelineTabs: SpecimenTimelineTab[];
  trackingTimelineData: TrackingTimelineData;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

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
  eventType: null | string | undefined,
  eventStatus: null | string | undefined,
) {
  return `${formatTrackingEventType(eventType)} / ${formatTrackingEventStatus(eventStatus)}`;
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
              {{ buildEventTitle(group.eventType, group.eventStatus) }}
            </div>
            <dl class="grid gap-2 text-sm">
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">时间</dt>
                <dd class="text-foreground">
                  {{ formatDateTime(group.eventTime) }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">操作人</dt>
                <dd class="text-foreground">
                  {{ formatAggregateContext(group.operatorNames, '多操作人') }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">IP</dt>
                <dd class="text-foreground">
                  {{ formatAggregateContext(group.operatorIps, '多IP') }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">事件</dt>
                <dd class="text-foreground">
                  {{ formatEventSummary(group.eventContents) }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
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
              {{ buildEventTitle(event.eventType, event.eventStatus) }}
            </div>
            <dl class="grid gap-2 text-sm">
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">时间</dt>
                <dd class="text-foreground">
                  {{ formatDateTime(event.eventTime) }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">操作人</dt>
                <dd class="text-foreground">
                  {{ formatNullable(event.operatorName) }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">IP</dt>
                <dd class="text-foreground">
                  {{ formatNullable(event.operatorIp) }}
                </dd>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-x-3">
                <dt class="text-muted-foreground">事件</dt>
                <dd class="text-foreground">
                  {{ formatTrackingEventContent(event) }}
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
