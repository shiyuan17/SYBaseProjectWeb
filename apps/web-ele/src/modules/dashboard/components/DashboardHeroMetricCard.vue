<script setup lang="ts">
import type { DashboardHeroMetric } from '../types/dashboard';

const props = withDefaults(
  defineProps<{
    actionLabel?: string;
    eyebrow?: string;
    metric: DashboardHeroMetric;
  }>(),
  {
    actionLabel: '查看详情',
    eyebrow: '',
  },
);

const emit = defineEmits<{
  open: [];
}>();

function handleOpen() {
  emit('open');
}

function getAccentClasses(accent: DashboardHeroMetric['accent']) {
  switch (accent) {
    case 'amber': {
      return {
        chip: 'bg-[color-mix(in_srgb,var(--el-color-warning)_12%,transparent)] text-[var(--el-color-warning)] ring-[color-mix(in_srgb,var(--el-color-warning)_28%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-warning)_20%,transparent)] via-[color-mix(in_srgb,var(--el-color-warning)_8%,transparent)] to-transparent',
        orb: 'bg-[color-mix(in_srgb,var(--el-color-warning)_45%,transparent)]',
      };
    }
    case 'emerald': {
      return {
        chip: 'bg-[color-mix(in_srgb,var(--el-color-success)_12%,transparent)] text-[var(--el-color-success)] ring-[color-mix(in_srgb,var(--el-color-success)_28%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-success)_20%,transparent)] via-[color-mix(in_srgb,var(--el-color-success)_8%,transparent)] to-transparent',
        orb: 'bg-[color-mix(in_srgb,var(--el-color-success)_45%,transparent)]',
      };
    }
    case 'rose': {
      return {
        chip: 'bg-[color-mix(in_srgb,var(--el-color-danger)_12%,transparent)] text-[var(--el-color-danger)] ring-[color-mix(in_srgb,var(--el-color-danger)_28%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-danger)_20%,transparent)] via-[color-mix(in_srgb,var(--el-color-danger)_8%,transparent)] to-transparent',
        orb: 'bg-[color-mix(in_srgb,var(--el-color-danger)_45%,transparent)]',
      };
    }
    default: {
      return {
        chip: 'bg-[color-mix(in_srgb,var(--el-color-primary)_12%,transparent)] text-[var(--el-color-primary)] ring-[color-mix(in_srgb,var(--el-color-primary)_28%,transparent)]',
        glow: 'from-[color-mix(in_srgb,var(--el-color-primary)_20%,transparent)] via-[color-mix(in_srgb,var(--el-color-primary)_8%,transparent)] to-transparent',
        orb: 'bg-[color-mix(in_srgb,var(--el-color-primary)_45%,transparent)]',
      };
    }
  }
}

const accentClasses = getAccentClasses(props.metric.accent);
</script>

<template>
  <article
    class="group relative overflow-hidden rounded-[28px] border border-border bg-card/95 p-5 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90"
      :class="accentClasses.glow"
    ></div>
    <div
      class="pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full blur-3xl"
      :class="accentClasses.orb"
    ></div>
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--el-bg-color)_78%,transparent),color-mix(in_srgb,var(--el-bg-color-page)_34%,transparent))]"
    ></div>

    <div class="relative flex h-full flex-col">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-2">
          <span
            v-if="eyebrow"
            class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset"
            :class="accentClasses.chip"
          >
            {{ eyebrow }}
          </span>
          <div class="text-sm font-semibold tracking-[0.02em] text-foreground">
            {{ metric.title }}
          </div>
        </div>
        <span
          class="rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground"
        >
          {{ metric.unit }}
        </span>
      </div>

      <div class="mt-8 flex items-end gap-2">
        <span class="text-4xl font-semibold tracking-tight text-foreground">{{
          metric.value
        }}</span>
        <span class="pb-1 text-xs text-muted-foreground">{{
          metric.unit
        }}</span>
      </div>

      <p class="mt-3 max-w-[28ch] text-sm leading-6 text-muted-foreground">
        {{ metric.description }}
      </p>

      <button
        class="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/85 px-4 py-2 text-sm text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
        type="button"
        @click="handleOpen"
      >
        <span>{{ actionLabel }}</span>
        <span
          aria-hidden="true"
          class="text-base transition-transform duration-300 group-hover:translate-x-0.5"
          >→</span
        >
      </button>
    </div>
  </article>
</template>
