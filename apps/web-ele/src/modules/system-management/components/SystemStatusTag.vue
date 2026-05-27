<script setup lang="ts">
import { computed } from 'vue';

import { ElTag } from 'element-plus';

const props = defineProps<{
  enabled: boolean;
}>();

const tagType = computed(() => (props.enabled ? 'success' : 'info'));
const tagText = computed(() => (props.enabled ? '启用' : '停用'));
</script>

<template>
  <ElTag :type="tagType" effect="light" round>
    {{ tagText }}
  </ElTag>
</template>
