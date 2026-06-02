<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

const route = useRoute();

const pageTitle = computed(() => String(route.meta.title || '制片工作站'));
</script>

<template>
  <Page :title="pageTitle" description="页面建设中，当前为菜单占位页。">
    <div
      class="rounded border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-muted-foreground"
    >
      {{ pageTitle }}暂未接入业务功能。
    </div>
  </Page>
</template>
