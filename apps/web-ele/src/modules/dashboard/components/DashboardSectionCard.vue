<script setup lang="ts">
import { ElCard } from 'element-plus';

withDefaults(
  defineProps<{
    bodyClass?: string;
    cardClass?: string;
    description?: string;
    headerClass?: string;
    title: string;
  }>(),
  {
    bodyClass: '',
    cardClass: '',
    description: '',
    headerClass: '',
  },
);
</script>

<template>
  <ElCard :body-class="bodyClass" :class="cardClass" shadow="never">
    <template #header>
      <div
        class="flex items-start justify-between gap-3"
        :class="[headerClass]"
      >
        <div>
          <div class="text-base font-semibold text-foreground">{{ title }}</div>
          <div v-if="description" class="mt-1 text-sm text-muted-foreground">
            {{ description }}
          </div>
        </div>
        <slot name="header-extra"></slot>
      </div>
    </template>
    <slot></slot>
  </ElCard>
</template>
