<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { M4_WORKFLOW_ROUTE_ITEMS } from '../constants';

const router = useRouter();
const accessStore = useAccessStore();

const targetPath = computed(() => {
  const accessCodes = new Set(accessStore.accessCodes);
  return (
    M4_WORKFLOW_ROUTE_ITEMS.find((item) => accessCodes.has(item.code))?.path ??
    null
  );
});

onMounted(() => {
  if (targetPath.value) {
    void router.replace(targetPath.value);
  }
});
</script>

<template>
  <div class="flex min-h-[360px] items-center justify-center">
    <Fallback v-if="!targetPath" status="403" />
  </div>
</template>
