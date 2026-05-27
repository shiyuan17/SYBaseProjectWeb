<script setup lang="ts">
import { ElAlert, ElButton } from 'element-plus';

defineProps<{
  message: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <ElAlert :closable="false" show-icon title="页面数据加载失败" type="error">
    <div class="mt-1 flex flex-wrap items-center gap-3">
      <span>{{ message }}</span>
      <ElButton link type="primary" @click="$emit('retry')">重新加载</ElButton>
    </div>
  </ElAlert>
</template>
