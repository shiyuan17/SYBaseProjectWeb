<script setup lang="ts">
import type { MessageTopicView } from '../../types/system-management';

import { ElCheckbox, ElCheckboxGroup } from 'element-plus';

defineProps<{
  authState: {
    topicIds: string[];
  };
  topics: MessageTopicView[];
}>();
</script>

<template>
  <ElCheckboxGroup
    v-model="authState.topicIds"
    class="grid gap-3 lg:grid-cols-2"
  >
    <ElCheckbox
      v-for="topic in topics"
      :key="topic.id"
      :label="topic.id"
      border
      class="!mx-0 !h-auto !items-start rounded-xl !px-4 !py-3"
    >
      <div class="flex flex-col gap-1 leading-5">
        <span class="font-medium text-foreground">
          {{ topic.topicName }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ topic.topicCode }}
        </span>
      </div>
    </ElCheckbox>
  </ElCheckboxGroup>
</template>
