<script setup lang="ts">
import type { MessageTopicView } from '../../types/system-management';

import { computed } from 'vue';

import { ElCheckbox, ElCheckboxGroup } from 'element-plus';

const props = defineProps<{
  authState: {
    topicIds: string[];
  };
  topics: MessageTopicView[];
}>();

const emit = defineEmits<{
  'update:topicIds': [value: string[]];
}>();

const topicIdsModel = computed({
  get: () => props.authState.topicIds,
  set: (value: string[]) => emit('update:topicIds', value),
});
</script>

<template>
  <ElCheckboxGroup v-model="topicIdsModel" class="grid gap-3 lg:grid-cols-2">
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
      </div>
    </ElCheckbox>
  </ElCheckboxGroup>
</template>
