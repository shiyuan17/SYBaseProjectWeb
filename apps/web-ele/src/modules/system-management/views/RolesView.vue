<script setup lang="ts">
import { Page } from '@vben/common-ui';

import RoleAuthorizationWorkspace from '../components/roles/RoleAuthorizationWorkspace.vue';
import RoleDialog from '../components/roles/RoleDialog.vue';
import RolesListPanel from '../components/roles/RolesListPanel.vue';
import RoleSummaryPanel from '../components/roles/RoleSummaryPanel.vue';
import SystemLoadError from '../components/SystemLoadError.vue';
import { useRolesPage } from '../composables/useRolesPage';

const {
  AUTHORIZATION_PANELS,
  STAT_SCOPE_OPTIONS,
  activeAuthorizationPanel,
  activeAuthorizationPanelMeta,
  activeRole,
  activeRoleId,
  authLoading,
  authSaving,
  authState,
  formatDataScopeLabel,
  formatRoleTypeLabel,
  formatStatScopeLabel,
  handleCurrentRoleChange,
  handleDeleteRole,
  handleMenuCheck,
  loadInitialData,
  loading,
  menuTree,
  menuTreeDefaultCheckedKeys,
  menuTreeReloadKey,
  openCreateDialog,
  openEditDialog,
  pageError,
  permissionGroups,
  roleDialogMode,
  roleDialogVisible,
  roleForm,
  roles,
  saveAuthorization,
  statCategories,
  submitLoading,
  submitRoleForm,
  topics,
} = useRolesPage();
</script>

<template>
  <Page
    title="角色授权"
    description="维护角色基础信息，并按菜单、权限、消息主题和统计范围四个维度配置授权。角色编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <RolesListPanel
        :active-role-id="activeRoleId"
        :loading="loading"
        :roles="roles"
        @create="openCreateDialog"
        @delete="handleDeleteRole"
        @edit="openEditDialog"
        @select="handleCurrentRoleChange"
      />

      <div class="flex flex-col gap-4">
        <RoleSummaryPanel
          :active-role="activeRole"
          :auth-saving="authSaving"
          :format-data-scope-label="formatDataScopeLabel"
          :format-role-type-label="formatRoleTypeLabel"
          @save="saveAuthorization"
        />

        <RoleAuthorizationWorkspace
          v-model:active-authorization-panel="activeAuthorizationPanel"
          :active-authorization-panel-meta="activeAuthorizationPanelMeta"
          :active-role="activeRole"
          :auth-loading="authLoading"
          :auth-state="authState"
          :authorization-panels="AUTHORIZATION_PANELS"
          :format-stat-scope-label="formatStatScopeLabel"
          :menu-tree="menuTree"
          :menu-tree-default-checked-keys="menuTreeDefaultCheckedKeys"
          :menu-tree-reload-key="menuTreeReloadKey"
          :permission-groups="permissionGroups"
          :stat-categories="statCategories"
          :stat-scope-options="STAT_SCOPE_OPTIONS"
          :topics="topics"
          @menu-check="handleMenuCheck"
          @update:permission-ids="authState.permissionIds = $event"
          @update:stat-scope="
            (categoryId, value) => {
              authState.statScopes[categoryId] = value;
            }
          "
          @update:topic-ids="authState.topicIds = $event"
        />
      </div>
    </div>

    <RoleDialog
      v-model="roleDialogVisible"
      :mode="roleDialogMode"
      :role-form="roleForm"
      :submit-loading="submitLoading"
      @submit="submitRoleForm"
      @update:role-form="Object.assign(roleForm, $event)"
    />
  </Page>
</template>
