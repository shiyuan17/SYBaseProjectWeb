<script setup lang="ts">
import type { ReagentStockView } from '../types/operation-support';

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

import { REAGENT_STOCK_STATUS_OPTIONS } from '../constants';
import { formatNullable, formatReagentStockStatus } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type StockFiltersState = {
  keyword: string;
  stockStatus: string;
};

defineProps<{
  canManageStocks: boolean;
  canQueryStocks: boolean;
  getStockStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  stocks: ReagentStockView[];
}>();

const emit = defineEmits<{
  (event: 'loadStocks'): void;
  (event: 'openCreateStockDialog'): void;
  (event: 'openEditStockDialog', row: ReagentStockView): void;
  (event: 'setSelectedStock', row: null | ReagentStockView): void;
}>();

const stockFilters = defineModel<StockFiltersState>('stockFilters', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    v-if="canQueryStocks || canManageStocks"
    title="试剂库存批次"
    description="维护试剂库存批次、数量、阈值、有效期和库位。"
  >
    <template #extra>
      <ElButton
        v-if="canManageStocks"
        type="primary"
        @click="emit('openCreateStockDialog')"
      >
        新增库存
      </ElButton>
    </template>
    <ElAlert
      v-if="!canQueryStocks"
      :closable="false"
      title="当前账号没有库存批次查询权限，仅可使用已开放的库存维护能力。"
      type="warning"
    />
    <template v-else>
      <ElForm inline label-width="88px">
        <ElFormItem label="关键字">
          <ElInput
            v-model="stockFilters.keyword"
            clearable
            placeholder="试剂/批号"
            style="width: 220px"
            @keyup.enter="emit('loadStocks')"
          />
        </ElFormItem>
        <ElFormItem label="库存状态">
          <ElSelect
            v-model="stockFilters.stockStatus"
            clearable
            placeholder="全部"
            style="width: 160px"
          >
            <ElOption
              v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="loading"
            type="primary"
            @click="emit('loadStocks')"
          >
            查询
          </ElButton>
        </ElFormItem>
      </ElForm>
      <ElTable
        v-loading="loading"
        :data="stocks"
        border
        highlight-current-row
        @current-change="emit('setSelectedStock', $event)"
      >
        <ElTableColumn label="试剂" min-width="220">
          <template #default="{ row }">
            {{ formatNullable(row.reagentCode) }}
            {{ formatNullable(row.reagentName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="批号" min-width="140" prop="batchNo" />
        <ElTableColumn label="数量" min-width="100">
          <template #default="{ row }">
            {{ formatNullable(row.stockQuantity) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="110">
          <template #default="{ row }">
            <ElTag :type="getStockStatusTagType(row.stockStatus)">
              {{ formatReagentStockStatus(row.stockStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="有效期" min-width="130">
          <template #default="{ row }">
            {{ formatNullable(row.expiryDate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="存放位置" min-width="160">
          <template #default="{ row }">
            {{ formatNullable(row.storageLocation) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="canManageStocks"
          fixed="right"
          label="操作"
          width="100"
        >
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click="emit('openEditStockDialog', row)"
            >
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
