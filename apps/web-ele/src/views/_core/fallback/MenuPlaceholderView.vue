<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

const route = useRoute();

const pageTitle = computed(() => String(route.meta.title || '页面占位'));
const pageDescription = computed(() =>
  String(route.meta.description || '当前页面暂未接入具体业务功能。'),
);
</script>

<template>
  <Page :show-header="false" :title="pageTitle" :description="pageDescription">
    <div
      class="rounded border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-muted-foreground"
    >
      {{ pageTitle }}暂未开放，当前为菜单占位页。
    </div>
  </Page>
</template>
