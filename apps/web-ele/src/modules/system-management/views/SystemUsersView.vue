<script setup lang="ts">
import { Page } from '@vben/common-ui';

import SystemLoadError from '../components/SystemLoadError.vue';
import SystemUserDialog from '../components/system-users/SystemUserDialog.vue';
import SystemUserLogDrawer from '../components/system-users/SystemUserLogDrawer.vue';
import SystemUserPrintDialog from '../components/system-users/SystemUserPrintDialog.vue';
import SystemUserRoleDialog from '../components/system-users/SystemUserRoleDialog.vue';
import SystemUsersFilterPanel from '../components/system-users/SystemUsersFilterPanel.vue';
import SystemUsersTablePanel from '../components/system-users/SystemUsersTablePanel.vue';
import { useSystemUsersPage } from '../composables/useSystemUsersPage';

const {
  YES_NO_OPTIONS,
  activeUserName,
  closePrintDialog,
  exportLoading,
  filters,
  handleDepartmentChange,
  handleExport,
  handleImport,
  handlePrintLoginTag,
  handleReset,
  handleSearch,
  importLoading,
  loading,
  loadInitialData,
  loadLoginLogs,
  logDrawerVisible,
  logLoading,
  logPagination,
  loginLogs,
  openCreateDialog,
  openEditDialog,
  openLogDrawer,
  openRoleDialog,
  pageError,
  primaryRoleId,
  printDialogVisible,
  printPreview,
  roleDialogVisible,
  roleOptions,
  roleSaving,
  selectedRoleIds,
  selectedRoleOptions,
  selectedRolesLabel,
  submitRoleAssignment,
  submitLoading,
  submitUserForm,
  toggleUserEnabled,
  total,
  userDialogMode,
  userDialogVisible,
  userForm,
  users,
} = useSystemUsersPage();
</script>

<template>
  <Page
    title="系统用户"
    description="维护系统用户、角色分配、登录日志、导入导出与登录标签，用户编码和登录标签编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />

    <div class="flex flex-col gap-4">
      <SystemUsersFilterPanel
        :filters="filters"
        :yes-no-options="YES_NO_OPTIONS"
        @reset="handleReset"
        @search="handleSearch"
      />

      <SystemUsersTablePanel
        :export-loading="exportLoading"
        :filters="filters"
        :import-loading="importLoading"
        :loading="loading"
        :selected-roles-label="selectedRolesLabel"
        :total="total"
        :users="users"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @export="handleExport"
        @import="handleImport"
        @logs="openLogDrawer"
        @print-tag="handlePrintLoginTag"
        @reload="loadInitialData"
        @roles="openRoleDialog"
        @toggle-enabled="toggleUserEnabled"
      />
    </div>

    <SystemUserDialog
      v-model="userDialogVisible"
      :mode="userDialogMode"
      :submit-loading="submitLoading"
      :user-form="userForm"
      @department-change="handleDepartmentChange"
      @submit="submitUserForm"
    />

    <SystemUserRoleDialog
      v-model="roleDialogVisible"
      v-model:primary-role-id="primaryRoleId"
      v-model:selected-role-ids="selectedRoleIds"
      :active-user-name="activeUserName"
      :role-options="roleOptions"
      :role-saving="roleSaving"
      :selected-role-options="selectedRoleOptions"
      @submit="submitRoleAssignment"
    />

    <SystemUserLogDrawer
      v-model="logDrawerVisible"
      :active-user-name="activeUserName"
      :login-logs="loginLogs"
      :log-loading="logLoading"
      :log-pagination="logPagination"
      @reload="loadLoginLogs"
    />

    <SystemUserPrintDialog
      v-model="printDialogVisible"
      :print-preview="printPreview"
      @close="closePrintDialog"
    />
  </Page>
</template>
