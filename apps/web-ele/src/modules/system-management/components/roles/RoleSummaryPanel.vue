<script setup lang="ts">
import type { RoleView } from '../../types/system-management';

import { ElButton, ElDescriptions, ElDescriptionsItem, ElEmpty } from 'element-plus';

import { M1_PERMISSION_CODES } from '../../constants';
import { formatDateTime, formatNullable } from '../../utils/format';
import SystemSectionCard from '../SystemSectionCard.vue';
import SystemStatusTag from '../SystemStatusTag.vue';

defineProps<{
  activeRole: null | RoleView;
  authSaving: boolean;
  formatDataScopeLabel: (value?: null | string) => string;
  formatRoleTypeLabel: (value?: null | string) => string;
}>();

const emit = defineEmits<{
  save: [];
}>();
</script>

<template>
  <SystemSectionCard
    title="角色摘要"
    description="展示当前角色基础信息，并在下方切换不同授权分区。"
  >
    <template #extra>
      <ElButton
        v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_ASSIGN"
        :disabled="!activeRole"
        :loading="authSaving"
        type="primary"
        @click="emit('save')"
      >
        保存授权
      </ElButton>
    </template>

    <ElDescriptions v-if="activeRole" :column="2" border>
      <ElDescriptionsItem label="角色名称">
        {{ activeRole.roleName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <SystemStatusTag :enabled="activeRole.enabled" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="角色类型">
        {{ formatRoleTypeLabel(activeRole.roleType) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="数据范围">
        {{ formatDataScopeLabel(activeRole.dataScope) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="更新时间">
        {{ formatDateTime(activeRole.updatedAt) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="备注" :span="2">
        {{ formatNullable(activeRole.remarks) }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <ElEmpty v-else description="请先选择左侧角色" />
  </SystemSectionCard>
</template>
