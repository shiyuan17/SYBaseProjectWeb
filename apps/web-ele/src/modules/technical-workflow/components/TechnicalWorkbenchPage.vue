<script setup lang="ts">
import type {
  TechnicalWorkbenchAction,
  TechnicalWorkbenchActionEventPayload,
  TechnicalWorkbenchColumn,
  TechnicalWorkbenchDayTab,
  TechnicalWorkbenchFilterConfig,
  TechnicalWorkbenchPageConfig,
  TechnicalWorkbenchPageExpose,
  TechnicalWorkbenchQueryActionEventPayload,
  TechnicalWorkbenchRow,
} from '../types/technical-workbench';

import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDatePicker,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  buildDateRangeQueryParams,
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
  resolveRouteDateRange,
} from '../utils/date-range';

const props = defineProps<{
  config: TechnicalWorkbenchPageConfig;
}>();
const emit = defineEmits<{
  (
    event: 'toolbarAction',
    payload: TechnicalWorkbenchActionEventPayload,
  ): void;
  (
    event: 'queryAction',
    payload: TechnicalWorkbenchQueryActionEventPayload,
  ): void;
  (event: 'selectionChange', rows: TechnicalWorkbenchRow[]): void;
}>();
const route = useRoute();
const instance = getCurrentInstance();
const dateRangeShortcuts = createDateRangePickerShortcuts();

const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(props.config.defaultPageSize);
const selectedRows = ref<TechnicalWorkbenchRow[]>([]);
const activeWorkday = ref(props.config.defaultWorkday);
const activeStatus = ref(props.config.defaultStatus ?? '');
const activeDateRange = ref<string[]>(resolveRouteDateRange(route.query));
const remoteRows = ref<TechnicalWorkbenchRow[]>([]);
const remoteTotal = ref(0);
const loading = ref(false);
const errorMessage = ref('');
let remoteRequestSequence = 0;
const pageTitle = computed(() =>
  props.config.showPageHeader === false ? undefined : props.config.title,
);
const pageDescription = computed(() =>
  props.config.showPageHeader === false ? undefined : props.config.description,
);
const hasRemoteDataSource = computed(() => Boolean(props.config.dataSource));

const filterState = reactive<Record<string, boolean>>(
  Object.fromEntries(
    (props.config.filters ?? []).map((filter) => [filter.id, false]),
  ),
);

const paginationPageSizes = computed(() =>
  [...new Set([10, 20, 30, 50, 100, pageSize.value])].toSorted(
    (left, right) => left - right,
  ),
);

const selectedFilterGroups = computed(() => {
  const groups = new Map<string, TechnicalWorkbenchFilterConfig[]>();

  for (const filter of props.config.filters ?? []) {
    if (!filterState[filter.id]) {
      continue;
    }
    const groupKey = filter.group ?? filter.id;
    const matchedGroup = groups.get(groupKey) ?? [];
    matchedGroup.push(filter);
    groups.set(groupKey, matchedGroup);
  }

  return [...groups.values()];
});

const filteredRows = computed(() => {
  const normalizedKeyword = searchKeyword.value.trim().toLowerCase();

  return (props.config.rows ?? []).filter((row) => {
    const matchesKeyword =
      !normalizedKeyword ||
      row.searchableText.toLowerCase().includes(normalizedKeyword);

    if (!matchesKeyword) {
      return false;
    }

    if (row.workday && row.workday !== activeWorkday.value) {
      return false;
    }

    return selectedFilterGroups.value.every((group) =>
      group.some((filter) => filter.predicate(row)),
    );
  });
});

const displayRows = computed(() =>
  hasRemoteDataSource.value ? remoteRows.value : pagedRows.value,
);

const totalCount = computed(() =>
  hasRemoteDataSource.value ? remoteTotal.value : filteredRows.value.length,
);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value)),
);

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

const metrics = computed(() =>
  (props.config.metrics ?? []).map((metric) => ({
    ...metric,
    displayValue: metric.value(
      hasRemoteDataSource.value ? remoteRows.value : filteredRows.value,
    ),
  })),
);

watch(filteredRows, () => {
  if (currentPage.value > pageCount.value) {
    currentPage.value = pageCount.value;
  }
  selectedRows.value = [];
});

watch(pageSize, () => {
  currentPage.value = 1;
  selectedRows.value = [];
  if (hasRemoteDataSource.value) {
    void loadRemoteRows();
  }
});

watch(currentPage, () => {
  selectedRows.value = [];
  if (hasRemoteDataSource.value) {
    void loadRemoteRows();
  }
});

watch(activeStatus, () => {
  restartRemoteQuery();
});

watch(activeDateRange, () => {
  restartRemoteQuery();
});

watch(
  () => props.config,
  (config) => {
    pageSize.value = config.defaultPageSize;
    currentPage.value = 1;
    activeWorkday.value = config.defaultWorkday;
    activeStatus.value = config.defaultStatus ?? '';
    activeDateRange.value = resolveRouteDateRange(route.query);
    remoteRows.value = [];
    remoteTotal.value = 0;
    selectedRows.value = [];
    if (config.dataSource) {
      void loadRemoteRows();
    }
  },
);

function formatCellValue(
  column: TechnicalWorkbenchColumn,
  row: TechnicalWorkbenchRow,
  rowIndex: number,
) {
  if (column.formatter) {
    return column.formatter(row, rowIndex);
  }

  const cellValue = row[column.key];
  return cellValue === undefined || cellValue === null || cellValue === ''
    ? '-'
    : String(cellValue);
}

function isActionDisabled(action: TechnicalWorkbenchAction) {
  return action.requiresSelection && selectedRows.value.length === 0;
}

function hasEventListener(name: 'query' | 'selection' | 'toolbar') {
  const props = instance?.vnode.props;

  if (!props) {
    return false;
  }

  if (name === 'toolbar') {
    return typeof props.onToolbarAction === 'function';
  }

  if (name === 'query') {
    return typeof props.onQueryAction === 'function';
  }

  return typeof props.onSelectionChange === 'function';
}

function createActionPayload(
  action: TechnicalWorkbenchAction,
): TechnicalWorkbenchActionEventPayload {
  return {
    action,
    selectedRows: [...selectedRows.value],
  };
}

function createQueryActionPayload(
  trigger: TechnicalWorkbenchQueryActionEventPayload['trigger'],
  action?: TechnicalWorkbenchAction,
): TechnicalWorkbenchQueryActionEventPayload {
  return {
    action,
    dateRange: [...activeDateRange.value],
    page: currentPage.value,
    pageSize: pageSize.value,
    searchKeyword: searchKeyword.value.trim(),
    selectedRows: [...selectedRows.value],
    status: activeStatus.value,
    trigger,
  };
}

function handleToolbarAction(action: TechnicalWorkbenchAction) {
  if (isActionDisabled(action)) {
    return;
  }

  if (hasEventListener('toolbar')) {
    emit('toolbarAction', createActionPayload(action));
    return;
  }

  ElMessage.info(`${action.label}功能待接入`);
}

function handleQueryAction(action: TechnicalWorkbenchAction) {
  if (isActionDisabled(action)) {
    return;
  }

  if (hasEventListener('query')) {
    emit('queryAction', createQueryActionPayload('action', action));
    return;
  }

  ElMessage.info(`${action.label}功能待接入`);
}

function handleSearch() {
  if (hasEventListener('query')) {
    emit('queryAction', createQueryActionPayload('search'));
    return;
  }

  if (hasRemoteDataSource.value) {
    restartRemoteQuery();
    return;
  }

  currentPage.value = 1;
}

function selectWorkday(dayTab: TechnicalWorkbenchDayTab) {
  activeWorkday.value = dayTab.value;
  currentPage.value = 1;
}

function restartRemoteQuery() {
  if (!hasRemoteDataSource.value) {
    return;
  }
  selectedRows.value = [];
  if (currentPage.value === 1) {
    void loadRemoteRows();
    return;
  }
  currentPage.value = 1;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '医嘱数据加载失败，请稍后重试';
}

async function loadRemoteRows() {
  const dataSource = props.config.dataSource;
  if (!dataSource) {
    return;
  }

  const requestId = ++remoteRequestSequence;
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await dataSource.load({
      ...buildDateRangeQueryParams(activeDateRange.value),
      page: currentPage.value,
      pathologyNo: searchKeyword.value.trim() || undefined,
      size: pageSize.value,
      status: activeStatus.value || undefined,
    });
    if (requestId !== remoteRequestSequence) {
      return;
    }
    remoteRows.value = result.rows;
    remoteTotal.value = result.total;
  } catch (error) {
    if (requestId !== remoteRequestSequence) {
      return;
    }
    errorMessage.value = getErrorMessage(error);
    remoteRows.value = [];
    remoteTotal.value = 0;
  } finally {
    if (requestId === remoteRequestSequence) {
      loading.value = false;
    }
  }
}

async function reload() {
  if (hasRemoteDataSource.value) {
    await loadRemoteRows();
  }
}

onMounted(() => {
  if (hasRemoteDataSource.value) {
    void loadRemoteRows();
  }
});

function handleSelectionChange(rows: TechnicalWorkbenchRow[]) {
  selectedRows.value = rows;
  emit('selectionChange', rows);
}

defineExpose<TechnicalWorkbenchPageExpose>({
  reload,
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle" :description="pageDescription">
    <div class="flex flex-col gap-3">
      <section class="rounded-lg border border-border bg-accent p-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex flex-1 flex-col gap-2">
            <div
              v-for="(group, groupIndex) in config.toolbarGroups"
              :key="`toolbar-group-${groupIndex}`"
              class="flex flex-wrap gap-1.5"
            >
              <ElButton
                v-for="action in group"
                :key="action.id"
                :disabled="isActionDisabled(action)"
                :type="action.tone === 'primary' ? 'primary' : undefined"
                class="!mx-0 !h-8 !rounded-sm !border-border !px-3 !text-xs"
                @click="handleToolbarAction(action)"
              >
                <span>{{ action.label }}</span>
                <span
                  v-if="action.hotkey"
                  class="ml-1 text-[11px] text-muted-foreground"
                >
                  ({{ action.hotkey }})
                </span>
              </ElButton>
            </div>
          </div>

          <div
            v-if="metrics.length > 0"
            class="flex flex-wrap items-center justify-end gap-3 text-sm"
          >
            <div
              v-for="metric in metrics"
              :key="metric.id"
              class="rounded border border-border bg-card px-3 py-1"
            >
              <span class="text-muted-foreground">{{ metric.label }}:</span>
              <span
                class="ml-1 font-semibold"
                :class="{
                  'text-emerald-600': metric.tone === 'success',
                  'text-rose-600': metric.tone === 'danger',
                  'text-sky-600': metric.tone === 'info',
                  'text-amber-600': metric.tone === 'warning',
                }"
              >
                {{ metric.displayValue }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-card p-3">
        <div class="flex flex-wrap items-center gap-2">
          <ElInput
            v-model="searchKeyword"
            :placeholder="config.searchPlaceholder"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <ElSelect
            v-if="config.statusOptions?.length"
            v-model="activeStatus"
            class="w-[150px]"
            placeholder="医嘱状态"
          >
            <ElOption label="全部状态" value="" />
            <ElOption
              v-for="statusOption in config.statusOptions"
              :key="statusOption.value"
              :label="statusOption.label"
              :value="statusOption.value"
            />
          </ElSelect>
          <ElDatePicker
            v-if="config.showWorkDatePicker"
            v-model="activeDateRange"
            :default-value="createDatePickerPanelDefaultValue()"
            :disabled-date="disableFutureDate"
            :shortcuts="dateRangeShortcuts"
            class="w-[260px]"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            type="daterange"
            unlink-panels
            value-format="YYYY-MM-DD"
          />
          <ElButton
            type="primary"
            class="!h-8 !rounded-sm !px-4 !text-xs"
            @click="handleSearch"
          >
            查询
          </ElButton>
          <ElButton
            v-for="action in config.queryActions ?? []"
            :key="action.id"
            :disabled="isActionDisabled(action)"
            class="!h-8 !rounded-sm !px-3 !text-xs"
            @click="handleQueryAction(action)"
          >
            <span>{{ action.label }}</span>
            <span
              v-if="action.hotkey"
              class="ml-1 text-[11px] text-muted-foreground"
            >
              ({{ action.hotkey }})
            </span>
          </ElButton>

          <div v-if="config.dayTabs?.length" class="flex flex-wrap gap-1 pl-2">
            <ElButton
              v-for="dayTab in config.dayTabs"
              :key="dayTab.value"
              :type="activeWorkday === dayTab.value ? 'primary' : undefined"
              class="!h-8 !rounded-sm !px-3 !text-xs"
              @click="selectWorkday(dayTab)"
            >
              {{ dayTab.label }}
            </ElButton>
          </div>
        </div>

        <div
          v-if="config.filters?.length"
          class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-border pt-3 text-sm text-muted-foreground"
        >
          <ElCheckbox
            v-for="filter in config.filters"
            :key="filter.id"
            v-model="filterState[filter.id]"
          >
            {{ filter.label }}
          </ElCheckbox>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border border-border bg-card">
        <ElAlert
          v-if="errorMessage"
          :closable="false"
          class="m-3"
          show-icon
          type="error"
        >
          <template #title>
            <span>{{ errorMessage }}</span>
            <ElButton link type="primary" @click="loadRemoteRows">
              重试
            </ElButton>
          </template>
        </ElAlert>
        <ElTable
          v-loading="loading"
          :data="displayRows"
          border
          size="small"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn type="selection" width="44" />
          <ElTableColumn
            v-for="column in config.columns"
            :key="column.key"
            :align="column.align"
            :label="column.label"
            :min-width="column.minWidth"
            :width="column.width"
          >
            <template #default="{ row, $index }">
              <span class="text-xs text-foreground">
                {{
                  formatCellValue(
                    column,
                    row,
                    (currentPage - 1) * pageSize + Number($index),
                  )
                }}
              </span>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty
          v-if="!loading && !errorMessage && displayRows.length === 0"
          :description="config.emptyText"
          class="py-8"
        />

        <div class="flex justify-end border-t border-border bg-card px-3 py-3">
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="paginationPageSizes"
            :total="totalCount"
            background
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </section>
    </div>
  </Page>
</template>
