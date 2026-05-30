<script setup lang="ts">
import type {
  DashboardWorkspaceQuickEntry,
  DashboardWorkspaceQuickEntryGroup,
} from '../types/dashboard';

import { ElButton, ElEmpty, ElSkeleton } from 'element-plus';

import DashboardSectionCard from './DashboardSectionCard.vue';

const props = withDefaults(
  defineProps<{
    error?: string;
    groups: DashboardWorkspaceQuickEntryGroup[];
    loading?: boolean;
  }>(),
  {
    error: '',
    loading: false,
  },
);

const emit = defineEmits<{
  open: [entry: DashboardWorkspaceQuickEntry];
  retry: [];
}>();

function handleOpen(entry: DashboardWorkspaceQuickEntry) {
  emit('open', entry);
}
</script>

<template>
  <DashboardSectionCard
    title="快捷入口矩阵"
    description="按业务域分组展示常用入口。"
    card-class="dashboard-surface border-0"
    body-class="px-5 pb-5 pt-2"
  >
    <div v-if="props.error" class="flex items-center justify-between gap-4">
      <span class="text-sm text-danger">{{ props.error }}</span>
      <ElButton @click="$emit('retry')">重试</ElButton>
    </div>
    <ElSkeleton v-else-if="loading" :rows="6" animated />
    <div v-else-if="groups.length > 0" class="grid gap-4">
      <section
        v-for="group in groups"
        :key="group.domainId"
        class="rounded-[24px] border border-border bg-card/75 p-4 shadow-sm"
      >
        <div class="mb-3 text-sm font-semibold text-foreground">
          {{ group.domainTitle }}
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <button
            v-for="entry in group.entries"
            :key="entry.id"
            class="rounded-[18px] border border-border bg-background/80 p-4 text-left text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
            type="button"
            @click="handleOpen(entry)"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold text-foreground">
                {{ entry.title }}
              </div>
              <span
                v-if="entry.highlight"
                class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
              >
                推荐
              </span>
            </div>
            <div class="mt-2 text-xs leading-5 text-muted-foreground">
              {{ entry.description }}
            </div>
          </button>
        </div>
      </section>
    </div>
    <ElEmpty v-else description="暂无快捷入口" />
  </DashboardSectionCard>
</template>
