<script setup lang="ts">
import type { UserLoginLog } from '../../types/system-management';

import { computed } from 'vue';

import { ElDrawer, ElPagination, ElTable, ElTableColumn } from 'element-plus';

import { formatDateTime, formatNullable } from '../../utils/format';

const props = defineProps<{
  activeUserName: string;
  loginLogs: UserLoginLog[];
  logLoading: boolean;
  logPagination: {
    page: number;
    size: number;
    total: number;
  };
  modelValue: boolean;
}>();

const emit = defineEmits<{
  reload: [];
  'update:logPagination': [
    value: { page: number; size: number; total: number },
  ];
  'update:modelValue': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const currentPageModel = computed({
  get: () => props.logPagination.page,
  set: (value: number) =>
    emit('update:logPagination', { ...props.logPagination, page: value }),
});

const pageSizeModel = computed({
  get: () => props.logPagination.size,
  set: (value: number) =>
    emit('update:logPagination', { ...props.logPagination, size: value }),
});
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    :title="`${activeUserName} 的登录日志`"
    size="58%"
  >
    <ElTable v-loading="logLoading" :data="loginLogs" border>
      <ElTableColumn label="登录时间" min-width="160">
        <template #default="scope">
          {{ formatDateTime(scope?.row?.loginAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="结果" min-width="100" prop="loginResult" />
      <ElTableColumn label="IP" min-width="140">
        <template #default="scope">
          {{ formatNullable(scope?.row?.clientIp) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="终端" min-width="180">
        <template #default="scope">
          {{ formatNullable(scope?.row?.clientDevice) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="失败原因" min-width="180">
        <template #default="scope">
          {{ formatNullable(scope?.row?.failureReason) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="currentPageModel"
        v-model:page-size="pageSizeModel"
        :total="logPagination.total"
        background
        layout="total, prev, pager, next"
        @current-change="emit('reload')"
        @size-change="emit('reload')"
      />
    </div>
  </ElDrawer>
</template>
