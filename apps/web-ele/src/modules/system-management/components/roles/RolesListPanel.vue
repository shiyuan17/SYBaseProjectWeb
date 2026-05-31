<script setup lang="ts">
import type { RoleView } from '../../types/system-management';

import { ElButton, ElTable, ElTableColumn } from 'element-plus';

import { M1_PERMISSION_CODES } from '../../constants';
import SystemSectionCard from '../SystemSectionCard.vue';
import SystemStatusTag from '../SystemStatusTag.vue';

defineProps<{
  activeRoleId: string;
  loading: boolean;
  roles: RoleView[];
}>();

const emit = defineEmits<{
  create: [];
  delete: [role: RoleView];
  edit: [role: RoleView];
  select: [role?: RoleView];
}>();
</script>

<template>
  <SystemSectionCard
    title="角色列表"
    description="创建、维护角色，并切换右侧授权配置。"
  >
    <template #extra>
      <ElButton
        v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_CREATE"
        type="primary"
        @click="emit('create')"
      >
        新增角色
      </ElButton>
    </template>

    <ElTable
      v-loading="loading"
      :current-row-key="activeRoleId"
      :data="roles"
      border
      highlight-current-row
      row-key="id"
      @current-change="emit('select', $event)"
      @row-click="emit('select', $event)"
    >
      <ElTableColumn label="角色名称" min-width="150" prop="roleName" />
      <ElTableColumn label="状态" width="90">
        <template #default="scope">
          <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="140">
        <template #default="scope">
          <div v-if="scope?.row" class="flex gap-2">
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_CREATE"
              link
              type="primary"
              @click.stop="emit('edit', scope.row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_CREATE"
              link
              type="danger"
              @click.stop="emit('delete', scope.row)"
            >
              删除
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>
  </SystemSectionCard>
</template>
