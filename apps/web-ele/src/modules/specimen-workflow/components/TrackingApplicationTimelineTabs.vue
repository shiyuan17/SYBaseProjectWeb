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
          :timestamp="formatDateTime(group.eventTime)"
          placement="top"
        >
          <div class="space-y-2">
            <div class="font-medium text-foreground">
              {{ formatTrackingEventType(group.eventType) }} /
              {{ formatTrackingEventStatus(group.eventStatus) }}
            </div>
            <div class="text-xs text-muted-foreground">
              节点: {{ formatNullable(group.nodeCode) }}，
              {{
                group.specimenCount > 0
                  ? `涉及标本: ${group.specimenCount} 个`
                  : '公共事件'
              }}
            </div>
            <div class="flex flex-wrap gap-2">
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
            </div>
            <div class="text-xs text-muted-foreground">
              操作人:
              {{ formatAggregateContext(group.operatorNames, '多操作人') }}，
              终端:
              {{ formatAggregateContext(group.sourceTerminals, '多终端') }}
            </div>
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
          :timestamp="formatDateTime(event.eventTime)"
          placement="top"
        >
          <div class="space-y-1">
            <div class="font-medium text-foreground">
              {{ formatTrackingEventType(event.eventType) }} /
              {{ formatTrackingEventStatus(event.eventStatus) }}
            </div>
            <div class="text-xs text-muted-foreground">
              节点: {{ formatNullable(event.nodeCode) }}，操作人:
              {{ formatNullable(event.operatorName) }}，终端:
              {{ formatNullable(event.sourceTerminal) }}
            </div>
          </div>
        </ElTimelineItem>
      </ElTimeline>
      <ElEmpty v-else description="该标本暂无追踪事件" />
    </ElTabPane>
  </ElTabs>
  <ElEmpty v-else description="暂无最近追踪事件" />
</template>
