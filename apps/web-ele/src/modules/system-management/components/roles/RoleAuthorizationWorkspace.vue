<script setup lang="ts">
import type {
  AuthorizationPanelKey,
  MenuTreeCheckState,
  MenuTreeNode,
} from '../../composables/useRolesPage';
import type {
  MessageTopicView,
  RoleView,
  StatCategoryView,
} from '../../types/system-management';

import { ElEmpty, ElTabPane, ElTabs } from 'element-plus';
import { computed } from 'vue';

import SystemSectionCard from '../SystemSectionCard.vue';
import RoleAuthorizationMenuPanel from './RoleAuthorizationMenuPanel.vue';
import RoleAuthorizationPermissionPanel from './RoleAuthorizationPermissionPanel.vue';
import RoleAuthorizationStatPanel from './RoleAuthorizationStatPanel.vue';
import RoleAuthorizationTopicPanel from './RoleAuthorizationTopicPanel.vue';

const props = defineProps<{
  activeAuthorizationPanel: AuthorizationPanelKey;
  activeAuthorizationPanelMeta: { description: string; label: string };
  activeRole: null | RoleView;
  authLoading: boolean;
  authState: {
    menuIds: string[];
    permissionIds: string[];
    statScopes: Record<string, string>;
    topicIds: string[];
  };
  authorizationPanels: Array<{
    description: string;
    key: AuthorizationPanelKey;
    label: string;
  }>;
  formatStatScopeLabel: (value?: null | string) => string;
  menuTree: MenuTreeNode[];
  menuTreeDefaultCheckedKeys: string[];
  menuTreeReloadKey: number;
  permissionGroups: Array<{
    entryPermissions: Array<{ id: string; permissionCode: string; permissionName: string }>;
    manualPermissions: Array<{ id: string; permissionCode: string; permissionName: string }>;
    menu: { id: string; menuCode: string; menuName: string };
  }>;
  statCategories: StatCategoryView[];
  statScopeOptions: Array<{ label: string; value: string }>;
  topics: MessageTopicView[];
}>();

const emit = defineEmits<{
  menuCheck: [node: MenuTreeNode, checkedState: MenuTreeCheckState];
  'update:activeAuthorizationPanel': [value: AuthorizationPanelKey];
}>();

const activePanelModel = computed({
  get: () => props.activeAuthorizationPanel,
  set: (value: AuthorizationPanelKey) =>
    emit('update:activeAuthorizationPanel', value),
});

function handleMenuCheck(node: MenuTreeNode, checkedState: MenuTreeCheckState) {
  emit('menuCheck', node, checkedState);
}
</script>

<template>
  <SystemSectionCard
    :title="activeAuthorizationPanelMeta.label"
    :description="activeAuthorizationPanelMeta.description"
  >
    <ElTabs v-model="activePanelModel" class="role-auth-tabs">
      <ElTabPane
        v-for="panel in authorizationPanels"
        :key="panel.key"
        :label="panel.label"
        :name="panel.key"
      >
        <template v-if="activeRole">
          <RoleAuthorizationMenuPanel
            v-if="panel.key === 'menus'"
            :auth-loading="authLoading"
            :menu-tree="menuTree"
            :menu-tree-default-checked-keys="menuTreeDefaultCheckedKeys"
            :menu-tree-reload-key="menuTreeReloadKey"
            @check="handleMenuCheck"
          />

          <RoleAuthorizationPermissionPanel
            v-else-if="panel.key === 'permissions'"
            :auth-state="authState"
            :permission-groups="permissionGroups"
          />

          <RoleAuthorizationTopicPanel
            v-else-if="panel.key === 'topics'"
            :auth-state="authState"
            :topics="topics"
          />

          <RoleAuthorizationStatPanel
            v-else
            :auth-state="authState"
            :format-stat-scope-label="formatStatScopeLabel"
            :stat-categories="statCategories"
            :stat-scope-options="statScopeOptions"
          />
        </template>
        <ElEmpty v-else description="请选择角色后查看授权内容" />
      </ElTabPane>
    </ElTabs>
  </SystemSectionCard>
</template>
