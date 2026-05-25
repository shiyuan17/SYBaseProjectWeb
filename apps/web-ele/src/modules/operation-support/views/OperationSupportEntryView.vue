<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getOperationSupportEntryPath } from '../access';

const router = useRouter();
const accessStore = useAccessStore();

const targetPath = computed(() => {
  return getOperationSupportEntryPath(accessStore.accessCodes);
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
