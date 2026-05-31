<script setup lang="ts">
import type { SystemUser } from '../../types/system-management';

import {
  ElButton,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';
import { ref } from 'vue';

import { M1_PERMISSION_CODES } from '../../constants';
import { formatDateTime, formatNullable } from '../../utils/format';
import SystemSectionCard from '../SystemSectionCard.vue';
import SystemStatusTag from '../SystemStatusTag.vue';

defineProps<{
  exportLoading: boolean;
  filters: {
    page: number;
    size: number;
  };
  importLoading: boolean;
  loading: boolean;
  selectedRolesLabel: (user: SystemUser) => string;
  total: number;
  users: SystemUser[];
}>();

const emit = defineEmits<{
  create: [];
  edit: [user: SystemUser];
  export: [];
  import: [event: Event];
  logs: [user: SystemUser];
  printTag: [user: SystemUser];
  reload: [];
  roles: [user: SystemUser];
  toggleEnabled: [user: SystemUser];
}>();

const importInputRef = ref<HTMLInputElement>();

function triggerImport() {
  importInputRef.value?.click();
}
</script>

<template>
  <SystemSectionCard
    title="用户列表"
    description="支持新增、编辑、启停、角色分配和登录日志查看。"
  >
    <template #extra>
      <input
        ref="importInputRef"
        accept=".xls,.xlsx"
        class="hidden"
        type="file"
        @change="emit('import', $event)"
      />
      <ElButton
        v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_CREATE"
        :loading="importLoading"
        @click="triggerImport"
      >
        导入
      </ElButton>
      <ElButton :loading="exportLoading" @click="emit('export')">导出</ElButton>
      <ElButton
        v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_CREATE"
        type="primary"
        @click="emit('create')"
      >
        新增用户
      </ElButton>
    </template>

    <ElTable v-loading="loading" :data="users" border>
      <ElTableColumn label="登录名" min-width="140" prop="loginName" />
      <ElTableColumn label="姓名" min-width="120" prop="name" />
      <ElTableColumn label="工号" min-width="120">
        <template #default="scope">
          {{ formatNullable(scope?.row?.jobNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="科室" min-width="140">
        <template #default="scope">
          {{ formatNullable(scope?.row?.departmentName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="角色" min-width="200">
        <template #default="scope">
          {{ scope?.row ? selectedRolesLabel(scope.row) : '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="90">
        <template #default="scope">
          <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="最近登录" min-width="160">
        <template #default="scope">
          {{ formatDateTime(scope?.row?.lastLoginAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="更新时间" min-width="160">
        <template #default="scope">
          {{ formatDateTime(scope?.row?.updatedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="320">
        <template #default="scope">
          <div v-if="scope?.row" class="flex flex-wrap gap-2">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
              link
              type="primary"
              @click="emit('edit', scope.row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
              link
              type="primary"
              @click="emit('toggleEnabled', scope.row)"
            >
              {{ scope.row.enabled ? '停用' : '启用' }}
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
              link
              type="primary"
              @click="emit('roles', scope.row)"
            >
              分配角色
            </ElButton>
            <ElButton link type="primary" @click="emit('logs', scope.row)">
              登录日志
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
              link
              type="primary"
              @click="emit('printTag', scope.row)"
            >
              登录标签
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="emit('reload')"
        @size-change="emit('reload')"
      />
    </div>
  </SystemSectionCard>
</template>
