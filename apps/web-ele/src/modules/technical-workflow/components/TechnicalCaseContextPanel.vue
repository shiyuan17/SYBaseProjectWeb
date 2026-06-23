<script setup lang="ts">
import type { WorkstationCaseContext } from '../types/technical-workflow';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import {
  formatCaseStatus,
  formatDateTime,
  formatEventStatus,
  formatEventType,
  formatNullable,
  formatTechnicalTrackingEventContent,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  context: null | WorkstationCaseContext;
  loading?: boolean;
}>();

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const summaryItems = computed(() => {
  if (!props.context) {
    return [];
  }
  return [
    { label: '病理号', value: formatNullable(props.context.pathologyNo) },
    { label: '病例状态', value: formatCaseStatus(props.context.caseStatus) },
    { label: '下一流向', value: props.context.nextFlowLabel },
    { label: '标本数', value: String(props.context.specimenCount) },
    { label: '蜡块数', value: String(props.context.blockCount) },
    { label: '包埋盒数', value: String(props.context.embeddingBoxCount) },
    { label: '玻片数', value: String(props.context.slideCount) },
    { label: '活跃任务', value: String(props.context.activeTaskCount) },
    { label: '待返工', value: String(props.context.pendingReworkCount) },
  ];
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <WorkflowSectionCard title="病例概览">
      <div v-if="context" class="grid gap-3 md:grid-cols-2">
        <article
          v-for="item in summaryItems"
          :key="item.label"
          class="rounded-lg border border-border bg-card p-3"
        >
          <div class="text-xs text-muted-foreground">{{ item.label }}</div>
          <div class="mt-1 text-sm font-semibold text-foreground">
            {{ item.value }}
          </div>
        </article>
      </div>
      <ElEmpty v-else description="选中任务后显示病例概览" />
    </WorkflowSectionCard>

    <WorkflowSectionCard title="生产提醒">
      <div v-if="context?.alerts.length" class="flex flex-col gap-3">
        <ElAlert
          v-for="alert in context.alerts"
          :key="alert.id"
          :closable="false"
          :title="alert.title"
          :type="alert.severity === 'danger' ? 'error' : alert.severity"
          show-icon
        >
          <template #default>
            <div class="text-sm leading-6">{{ alert.description }}</div>
            <div v-if="alert.action" class="mt-3">
              <ElButton
                plain
                size="small"
                type="primary"
                @click="navigation.goToAlertAction(alert.action)"
              >
                {{ alert.action.label }}
              </ElButton>
            </div>
          </template>
        </ElAlert>
      </div>
      <ElEmpty v-else description="当前没有需要前置提醒的异常或下一工位提示" />
    </WorkflowSectionCard>

    <WorkflowSectionCard title="质控与返工">
      <div
        v-if="context?.currentTaskSuggestions.length"
        class="flex flex-col gap-2"
      >
        <div
          v-for="suggestion in context.currentTaskSuggestions"
          :key="suggestion"
          class="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground"
        >
          {{ suggestion }}
        </div>
      </div>
      <ElEmpty v-else description="当前病例暂无质控或返工提醒" />
    </WorkflowSectionCard>

    <WorkflowSectionCard title="节点记录">
      <ElTimeline v-if="context?.recentEvents.length">
        <ElTimelineItem
          v-for="event in context.recentEvents"
          :key="`${event.eventTime}-${event.nodeCode}-${event.eventType}`"
          :timestamp="formatDateTime(event.eventTime)"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-foreground">{{
              formatEventType(event.eventType)
            }}</span>
            <ElTag effect="plain" size="small">
              {{ formatEventStatus(event.eventStatus) }}
            </ElTag>
            <span class="text-xs text-muted-foreground">
              {{ formatNullable(event.operatorName) }}
            </span>
          </div>
          <div class="mt-1 text-sm text-muted-foreground">
            {{ formatTechnicalTrackingEventContent(event) }}
          </div>
        </ElTimelineItem>
      </ElTimeline>
      <ElEmpty v-else description="当前病例暂无节点记录" />
    </WorkflowSectionCard>
  </div>
</template>
