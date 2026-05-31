<script setup lang="ts">
import type { ReagentView } from '../types/operation-support';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { REAGENT_ENABLED_OPTIONS } from '../constants';
import { formatNullable } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type ReagentFiltersState = {
  enabled: '' | boolean;
  keyword: string;
};

defineProps<{
  canCreateReagent: boolean;
  canQueryReagents: boolean;
  canUpdateReagent: boolean;
  loading: boolean;
  reagents: ReagentView[];
}>();

const emit = defineEmits<{
  (event: 'loadReagents'): void;
  (event: 'openCreateReagentDialog'): void;
  (event: 'openEditReagentDialog', row: ReagentView): void;
  (event: 'setSelectedReagent', row: null | ReagentView): void;
}>();

const reagentFilters = defineModel<ReagentFiltersState>('reagentFilters', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    v-if="canQueryReagents || canCreateReagent || canUpdateReagent"
    title="试剂基础信息"
    description="按关键字和启停状态维护试剂基础台账。"
  >
    <template #extra>
      <ElButton
        v-if="canCreateReagent"
        type="primary"
        @click="emit('openCreateReagentDialog')"
      >
        新增试剂
      </ElButton>
    </template>
    <ElAlert
      v-if="!canQueryReagents"
      :closable="false"
      title="当前账号没有试剂基础信息查询权限，仅可使用已开放的维护或预警能力。"
      type="warning"
    />
    <template v-else>
      <ElForm inline label-width="88px">
        <ElFormItem label="关键字">
          <ElInput
            v-model="reagentFilters.keyword"
            clearable
            placeholder="编码/名称"
            style="width: 220px"
            @keyup.enter="emit('loadReagents')"
          />
        </ElFormItem>
        <ElFormItem label="启停状态">
          <ElSelect
            v-model="reagentFilters.enabled"
            clearable
            placeholder="全部"
            style="width: 160px"
          >
            <ElOption
              v-for="option in REAGENT_ENABLED_OPTIONS"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="loading"
            type="primary"
            @click="emit('loadReagents')"
          >
            查询
          </ElButton>
        </ElFormItem>
      </ElForm>
      <ElTable
        v-loading="loading"
        :data="reagents"
        border
        highlight-current-row
        @current-change="emit('setSelectedReagent', $event)"
      >
        <ElTableColumn label="试剂编码" min-width="140" prop="reagentCode" />
        <ElTableColumn label="试剂名称" min-width="180" prop="reagentName" />
        <ElTableColumn label="规格" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.specification) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="单位" min-width="90">
          <template #default="{ row }">
            {{ formatNullable(row.unit) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="厂家" min-width="160">
          <template #default="{ row }">
            {{ formatNullable(row.manufacturer) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="低库存阈值" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.defaultLowStockThreshold) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="100">
          <template #default="{ row }">
            <ElTag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="canUpdateReagent"
          fixed="right"
          label="操作"
          width="100"
        >
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click="emit('openEditReagentDialog', row)"
            >
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
