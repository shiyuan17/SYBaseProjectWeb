<script setup lang="ts">
import type { DashboardWorkspaceTodoCard } from '../types/dashboard';

import { ElButton, ElEmpty, ElSkeleton, ElTag } from 'element-plus';

import { getVisualToneClasses } from '../utils/dashboard-visualization';
import DashboardSectionCard from './DashboardSectionCard.vue';

const props = withDefaults(
  defineProps<{
    error?: string;
    heroCard: DashboardWorkspaceTodoCard | null;
    loading?: boolean;
    secondaryCards: DashboardWorkspaceTodoCard[];
  }>(),
  {
    error: '',
    loading: false,
  },
);

const emit = defineEmits<{
  open: [card: DashboardWorkspaceTodoCard];
  openCenter: [];
  retry: [];
}>();

function resolveCardTone(card: DashboardWorkspaceTodoCard) {
  return card.tone === 'info' ? 'primary' : card.tone;
}

function resolveTagType(card: DashboardWorkspaceTodoCard) {
  if (card.tone === 'danger') {
    return 'danger';
  }
  if (card.tone === 'warning') {
    return 'warning';
  }
  if (card.tone === 'success') {
    return 'success';
  }
  return 'info';
}

function handleOpen(card: DashboardWorkspaceTodoCard) {
  emit('open', card);
}
</script>

<template>
  <DashboardSectionCard
    title="我的待办驾驶舱"
    description="展示当前待办卡片。"
    card-class="dashboard-surface border-0"
    body-class="px-5 pb-5 pt-2"
  >
    <div v-if="props.error" class="flex items-center justify-between gap-4">
      <span class="text-sm text-danger">{{ props.error }}</span>
      <ElButton @click="$emit('retry')">重试</ElButton>
    </div>
    <ElSkeleton v-else-if="loading" :rows="8" animated />
    <div v-else-if="heroCard" class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <article
        class="relative overflow-hidden rounded-[28px] border border-border bg-card/90 p-5 text-foreground shadow-sm"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-85"
          :class="getVisualToneClasses(resolveCardTone(heroCard)).glow"
        ></div>
        <div
          class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--el-bg-color)_82%,transparent),color-mix(in_srgb,var(--el-bg-color-page)_36%,transparent))]"
        ></div>
        <div class="relative flex h-full flex-col">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="getVisualToneClasses(resolveCardTone(heroCard)).badge"
              >
                {{ heroCard.domainTitle }}
              </span>
              <div class="mt-3 text-lg font-semibold text-foreground">
                {{ heroCard.title }}
              </div>
            </div>
            <ElTag :type="resolveTagType(heroCard)">
              {{ heroCard.tag || '待办' }}
            </ElTag>
          </div>
          <div
            class="mt-8 text-5xl font-semibold tracking-tight text-foreground"
          >
            {{ heroCard.value }}
          </div>
          <p class="mt-3 max-w-[30ch] text-sm leading-6 text-muted-foreground">
            {{ heroCard.description }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <ElButton type="primary" @click="handleOpen(heroCard)">
              进入处理
            </ElButton>
            <ElButton plain @click="$emit('openCenter')">
              查看协同消息
            </ElButton>
          </div>
        </div>
      </article>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <article
          v-for="card in secondaryCards"
          :key="card.id"
          class="rounded-[24px] border border-border bg-card/80 p-4 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div
                class="text-xs uppercase tracking-[0.16em] text-[var(--el-text-color-secondary)]"
              >
                {{ card.domainTitle }}
              </div>
              <div class="mt-2 text-sm font-semibold text-foreground">
                {{ card.title }}
              </div>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="getVisualToneClasses(card.tone).badge"
            >
              {{ card.tag || '待办' }}
            </span>
          </div>
          <div class="mt-4 flex items-end justify-between gap-3">
            <div class="text-3xl font-semibold text-foreground">
              {{ card.value }}
            </div>
            <button
              class="text-xs text-muted-foreground transition-colors hover:text-primary"
              type="button"
              @click="handleOpen(card)"
            >
              进入 →
            </button>
          </div>
        </article>
      </div>
    </div>
    <ElEmpty v-else description="暂无待办事项" />
  </DashboardSectionCard>
</template>
