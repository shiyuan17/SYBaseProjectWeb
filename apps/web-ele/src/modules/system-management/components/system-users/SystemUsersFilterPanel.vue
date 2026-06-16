<script setup lang="ts">
import { computed } from 'vue';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import SystemSectionCard from '../SystemSectionCard.vue';

const props = defineProps<{
  filters: {
    enabled: boolean | undefined;
    keyword: string;
  };
  yesNoOptions: Array<{ label: string; value: boolean }>;
}>();

const emit = defineEmits<{
  reset: [];
  search: [];
  'update:filters': [value: { enabled: boolean | undefined; keyword: string }];
}>();

const keywordModel = computed({
  get: () => props.filters.keyword,
  set: (value: string) =>
    emit('update:filters', { ...props.filters, keyword: value }),
});

const enabledModel = computed({
  get: () => props.filters.enabled,
  set: (value: boolean | undefined) =>
    emit('update:filters', { ...props.filters, enabled: value }),
});
</script>

<template>
  <SystemSectionCard
    title="筛选条件"
    description="支持关键字、启停状态与分页查询。"
  >
    <ElForm inline label-width="72px">
      <ElFormItem label="关键字">
        <ElInput
          v-model="keywordModel"
          clearable
          placeholder="姓名 / 登录名 / 工号"
          style="width: 240px"
          @keyup.enter="emit('search')"
        />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect
          v-model="enabledModel"
          clearable
          placeholder="全部状态"
          style="width: 160px"
        >
          <ElOption
            v-for="option in yesNoOptions"
            :key="String(option.value)"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="emit('search')">查询</ElButton>
        <ElButton @click="emit('reset')">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </SystemSectionCard>
</template>
