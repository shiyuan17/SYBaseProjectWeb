<script setup lang="ts">
import type {
  StatIndicatorView,
  StatReportTemplateView,
} from '../types/m6-statistics';
import type {
  PeriodMode,
  ReportWorkbenchFilterState,
  WorkbenchTab,
} from '../utils/report-workbench';

import type { RoleView } from '#/modules/system-management/types/system-management';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElOption,
  ElSegmented,
  ElSelect,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { periodModeOptions } from '../utils/report-workbench';

defineProps<{
  activeTab: WorkbenchTab;
  exportLoading: boolean;
  filters: ReportWorkbenchFilterState;
  indicators: StatIndicatorView[];
  loading: boolean;
  roles: RoleView[];
  templates: StatReportTemplateView[];
}>();

const emit = defineEmits<{
  departmentChange: [department: null | { id: string; name: string }];
  export: [];
  filterChange: [
    field: Exclude<keyof ReportWorkbenchFilterState, 'periodMode'>,
    value: string | string[],
  ];
  periodModeChange: [value: PeriodMode];
  query: [];
  reset: [];
  userChange: [user: null | { id: string; name: string }];
}>();

function updateFilter(
  field: Exclude<keyof ReportWorkbenchFilterState, 'periodMode'>,
  value: string | string[],
) {
  emit('filterChange', field, value);
}
</script>

<template>
  <ElForm inline label-width="90px">
    <ElFormItem label="统计周期">
      <ElSegmented
        :model-value="filters.periodMode"
        :options="periodModeOptions"
        @update:model-value="emit('periodModeChange', $event as PeriodMode)"
      />
    </ElFormItem>
    <ElFormItem label="时间范围">
      <ElDatePicker
        :model-value="filters.dateRange"
        end-placeholder="结束时间"
        range-separator="至"
        start-placeholder="开始时间"
        style="width: 340px"
        type="datetimerange"
        value-format="YYYY-MM-DDTHH:mm:ss"
        @update:model-value="updateFilter('dateRange', $event as string[])"
      />
    </ElFormItem>
    <ElFormItem label="统计模板">
      <ElSelect
        :model-value="filters.templateCode"
        clearable
        placeholder="请选择统计模板"
        style="width: 220px"
        @update:model-value="updateFilter('templateCode', String($event ?? ''))"
      >
        <ElOption
          v-for="item in templates"
          :key="item.id"
          :label="item.templateName"
          :value="item.templateCode"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="统计指标">
      <ElSelect
        :model-value="filters.indicatorCode"
        clearable
        placeholder="请选择统计指标"
        style="width: 240px"
        @update:model-value="
          updateFilter('indicatorCode', String($event ?? ''))
        "
      >
        <ElOption
          v-for="item in indicators"
          :key="item.id"
          :label="item.indicatorName"
          :value="item.indicatorCode"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="送检科室">
      <DepartmentSelect
        :model-value="filters.departmentId"
        :selected-label="filters.departmentName"
        placeholder="请选择科室"
        style="width: 220px"
        @update:model-value="updateFilter('departmentId', String($event ?? ''))"
        @change="emit('departmentChange', $event)"
      />
    </ElFormItem>
    <ElFormItem v-if="activeTab === 'workload'" label="角色">
      <ElSelect
        :model-value="filters.roleId"
        clearable
        placeholder="请选择角色"
        style="width: 220px"
        @update:model-value="updateFilter('roleId', String($event ?? ''))"
      >
        <ElOption
          v-for="item in roles"
          :key="item.id"
          :label="item.roleName"
          :value="item.id"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem v-if="activeTab === 'workload'" label="人员">
      <SystemUserSelect
        :model-value="filters.workloadUserId"
        :selected-label="filters.workloadUserName"
        placeholder="请选择人员"
        style="width: 220px"
        @update:model-value="
          updateFilter('workloadUserId', String($event ?? ''))
        "
        @change="emit('userChange', $event)"
      />
    </ElFormItem>
    <ElFormItem>
      <ElButton :loading="loading" type="primary" @click="emit('query')">
        查询
      </ElButton>
      <ElButton @click="emit('reset')">重置</ElButton>
      <ElButton :loading="exportLoading" @click="emit('export')">
        导出 CSV
      </ElButton>
    </ElFormItem>
  </ElForm>
</template>
