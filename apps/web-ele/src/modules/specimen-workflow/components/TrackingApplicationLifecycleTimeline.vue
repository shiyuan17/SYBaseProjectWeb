<script setup lang="ts">
import type { TrackingLifecycleStage } from '../utils/tracking-lifecycle-timeline';

import { ElEmpty, ElTag } from 'element-plus';

import { formatDateTime, formatNullable } from '../utils/format';

defineProps<{
  stages: TrackingLifecycleStage[];
}>();

function formatFactValue(value: string, isDateTime: boolean) {
  if (value === '-') {
    return value;
  }
  return isDateTime ? formatDateTime(value) : formatNullable(value);
}
</script>

<template>
  <div v-if="stages.length > 0" class="grid gap-4">
    <section
      v-for="stage in stages"
      :key="stage.title"
      class="rounded-lg border border-border/70 bg-muted/20 p-4"
    >
      <header class="mb-3 flex items-center justify-between gap-3">
        <h4 class="text-sm font-semibold text-foreground">
          {{ stage.title }}
        </h4>
        <ElTag size="small" type="info">{{ stage.nodes.length }} 项</ElTag>
      </header>

      <div class="grid gap-3 lg:grid-cols-2">
        <article
          v-for="node in stage.nodes"
          :key="node.key"
          class="rounded-md border border-border bg-background p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h5 class="text-sm font-medium text-foreground">
                {{ node.title }}
              </h5>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ formatDateTime(node.occurredAt) }} /
                {{ formatNullable(node.operatorName) }}
              </div>
            </div>
            <ElTag size="small" type="info">
              {{ formatNullable(node.status) }}
            </ElTag>
          </div>

          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div
              v-for="fact in node.facts"
              :key="`${node.key}-${fact.label}`"
              class="grid grid-cols-[6rem_1fr] gap-x-2"
            >
              <dt class="text-muted-foreground">{{ fact.label }}</dt>
              <dd class="min-w-0 break-words text-foreground">
                {{ formatFactValue(fact.value, fact.isDateTime) }}
              </dd>
            </div>
          </dl>

          <div class="mt-3 text-xs text-muted-foreground">
            IP {{ formatNullable(node.operatorIp) }} / 设备
            <span
              class="inline-block max-w-80 truncate align-bottom"
              :title="formatNullable(node.operatorDevice)"
            >
              {{ formatNullable(node.operatorDevice) }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </div>
  <ElEmpty v-else description="暂无生命周期时间线" />
</template>
