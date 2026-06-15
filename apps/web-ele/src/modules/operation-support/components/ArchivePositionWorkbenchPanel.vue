<script setup lang="ts">
import type { ArchiveCabinetView } from '../types/operation-support';
import type { PositionWorkbenchRow } from '../utils/archive-workbench';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { ARCHIVE_CABINET_TYPE_OPTIONS } from '../constants';
import {
  formatArchiveCabinetType,
  formatArchivePositionStatus,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  cabinets: ArchiveCabinetView[];
  canQueryCabinets: boolean;
  getPositionStatusTagType: (
    status: string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  hideHeader?: boolean;
  loading: boolean;
  positionError: string;
  positionRows: PositionWorkbenchRow[];
  positionSummary: {
    available: number;
    disabled: number;
    occupied: number;
    total: number;
  };
  selectedPosition: null | PositionWorkbenchRow;
  selectedPositionCode: string;
  selectedPositionLabel: string;
}>();

const emit = defineEmits<{
  (event: 'clearSelectedPosition'): void;
  (event: 'loadPositions'): void;
  (event: 'selectPosition', row: PositionWorkbenchRow): void;
}>();

const cabinetId = defineModel<string>('cabinetId', { required: true });
const cabinetType = defineModel<string>('cabinetType', { required: true });
</script>

<template>
  <OperationSectionCard
    title="柜位查询与选择"
    description="按归档柜或柜体类型查询柜位，并为归档或替代归还选择当前可用柜位。"
    :hide-header="hideHeader"
  >
    <template v-if="!canQueryCabinets">
      <ElAlert :closable="false" type="warning">
        <template #title>
          当前账号缺少归档柜查询权限，无法查询可用柜位。
        </template>
        <template #default>
          若需要执行归档或为归还指定替代柜位，请先补齐 M5 归档柜查询权限。
        </template>
      </ElAlert>
    </template>

    <template v-else>
      <ElAlert
        v-if="positionError"
        :closable="false"
        class="mb-4"
        :title="positionError"
        show-icon
        type="error"
      />

      <ElForm inline label-width="96px">
        <ElFormItem label="归档柜">
          <ElSelect
            v-model="cabinetId"
            clearable
            filterable
            placeholder="全部归档柜"
            style="width: 240px"
          >
            <ElOption
              v-for="cabinet in cabinets"
              :key="cabinet.id"
              :label="`${cabinet.cabinetCode} ${cabinet.cabinetName}`"
              :value="cabinet.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="柜体类型">
          <ElSelect
            v-model="cabinetType"
            clearable
            placeholder="全部类型"
            style="width: 180px"
          >
            <ElOption
              v-for="option in ARCHIVE_CABINET_TYPE_OPTIONS"
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
            @click="emit('loadPositions')"
          >
            查询柜位
          </ElButton>
          <ElButton
            :disabled="!selectedPosition"
            @click="emit('clearSelectedPosition')"
          >
            清空选择
          </ElButton>
        </ElFormItem>
      </ElForm>

      <div class="mt-4 grid gap-4 md:grid-cols-4">
        <div class="rounded-lg border border-[var(--el-border-color)] p-4">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            柜位总数
          </div>
          <div class="mt-2 text-2xl font-semibold">
            {{ positionSummary.total }}
          </div>
        </div>
        <div class="rounded-lg border border-[var(--el-border-color)] p-4">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            可用柜位
          </div>
          <div
            class="mt-2 text-2xl font-semibold text-[var(--el-color-success)]"
          >
            {{ positionSummary.available }}
          </div>
        </div>
        <div class="rounded-lg border border-[var(--el-border-color)] p-4">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            已占用柜位
          </div>
          <div
            class="mt-2 text-2xl font-semibold text-[var(--el-color-warning)]"
          >
            {{ positionSummary.occupied }}
          </div>
        </div>
        <div class="rounded-lg border border-[var(--el-border-color)] p-4">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            已停用柜位
          </div>
          <div
            class="mt-2 text-2xl font-semibold text-[var(--el-text-color-secondary)]"
          >
            {{ positionSummary.disabled }}
          </div>
        </div>
      </div>

      <div
        class="mt-4 rounded-lg border border-dashed border-[var(--el-border-color)] p-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-sm text-[var(--el-text-color-secondary)]">
              当前选中柜位
            </div>
            <div class="mt-2 text-base font-medium">
              {{ selectedPositionLabel }}
            </div>
            <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
              <template v-if="selectedPosition">
                {{ selectedPosition.cabinetCode }} / 第
                {{ selectedPosition.layerNo }} 层 / 第
                {{ selectedPosition.slotNo }} 位
              </template>
              <template v-else>
                暂未选择柜位，可在下表中从“可用”柜位执行选择。
              </template>
            </div>
          </div>
          <ElTag v-if="selectedPosition" type="success">
            可直接用于归档 / 替代归还
          </ElTag>
        </div>
      </div>

      <ElTable v-loading="loading" :data="positionRows" border class="mt-4">
        <ElTableColumn label="柜位编码" min-width="180" prop="positionCode" />
        <ElTableColumn label="归档柜" min-width="180">
          <template #default="{ row }">
            {{ row.cabinetCode }} {{ row.cabinetName }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="柜体类型" min-width="120">
          <template #default="{ row }">
            {{ formatArchiveCabinetType(row.cabinetType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="层号" min-width="90" prop="layerNo" />
        <ElTableColumn label="位号" min-width="90" prop="slotNo" />
        <ElTableColumn label="柜位状态" min-width="110">
          <template #default="{ row }">
            <ElTag :type="getPositionStatusTagType(row.positionStatus)">
              {{ formatArchivePositionStatus(row.positionStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态说明" min-width="220">
          <template #default="{ row }">
            {{ row.statusReason }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="选择" min-width="110">
          <template #default="{ row }">
            <ElButton
              :disabled="!row.selectable"
              link
              type="primary"
              @click="emit('selectPosition', row)"
            >
              {{
                selectedPositionCode === row.positionCode ? '已选择' : '选择'
              }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
