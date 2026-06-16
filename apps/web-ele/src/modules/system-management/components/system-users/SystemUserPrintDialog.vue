<script setup lang="ts">
import type { PrintLoginTagResponse } from '../../types/system-management';

import { computed } from 'vue';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
} from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  printPreview: null | PrintLoginTagResponse;
}>();

const emit = defineEmits<{
  close: [];
  'update:modelValue': [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function handleClose() {
  emit('close');
}
</script>

<template>
  <ElDialog v-model="dialogVisible" title="登录标签预览" width="560px">
    <template v-if="printPreview">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="标题">
          {{ printPreview.title }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="标签编码">
          {{ printPreview.loginTagCode }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="内容">
          <pre class="text-foreground whitespace-pre-wrap text-sm">{{
            printPreview.content
          }}</pre>
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>
    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>
