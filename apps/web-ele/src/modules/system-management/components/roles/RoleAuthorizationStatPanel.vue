<script setup lang="ts">
import type { StatCategoryView } from '../../types/system-management';

import { ElOption, ElSelect, ElTable, ElTableColumn } from 'element-plus';

defineProps<{
  authState: {
    statScopes: Record<string, string>;
  };
  formatStatScopeLabel: (value?: null | string) => string;
  statCategories: StatCategoryView[];
  statScopeOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  'update:statScope': [categoryId: string, value: string];
}>();
</script>

<template>
  <ElTable :data="statCategories" border>
    <ElTableColumn label="统计分类" min-width="220">
      <template #default="scope">
        <template v-if="scope?.row">
          <div class="flex flex-col gap-1">
            <span class="font-medium text-foreground">
              {{ scope.row.statName }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ scope.row.statCode }}
            </span>
          </div>
        </template>
      </template>
    </ElTableColumn>
    <ElTableColumn label="范围" min-width="220">
      <template #default="scope">
        <ElSelect
          v-if="scope?.row"
          :model-value="authState.statScopes[scope.row.id]"
          clearable
          placeholder="请选择范围"
          @update:model-value="
            (value) => emit('update:statScope', scope.row.id, value)
          "
        >
          <ElOption
            v-for="option in statScopeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </template>
    </ElTableColumn>
    <ElTableColumn label="当前说明" min-width="160">
      <template #default="scope">
        <template v-if="scope?.row">
          {{ formatStatScopeLabel(authState.statScopes[scope.row.id]) }}
        </template>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
