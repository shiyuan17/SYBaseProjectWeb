import type {
  CreateSystemUserRequest,
  PrintLoginTagResponse,
  RoleView,
  SystemUser,
  UpdateSystemUserRequest,
  UserLoginLog,
} from '../types/system-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  assignSystemUserRoles,
  createSystemUser,
  exportSystemUsers,
  importSystemUsers,
  listRoles,
  listSystemUsers,
  listUserLoginLogs,
  printSystemUserLoginTag,
  updateSystemUser,
  updateSystemUserEnabled,
} from '../api/system-management-service';
import { YES_NO_OPTIONS } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { downloadBlobFile } from '../utils/file-download';
import {
  buildSystemUserCreatePayload,
  buildSystemUserUpdatePayload,
} from '../utils/submit-payloads';

export type UserFormState = Omit<
  CreateSystemUserRequest,
  | 'avatar'
  | 'departmentId'
  | 'departmentName'
  | 'email'
  | 'jobNo'
  | 'loginTagCode'
  | 'phone'
  | 'titleName'
  | 'userCode'
> & {
  avatar: string;
  departmentId: string;
  departmentName: string;
  email: string;
  id?: string;
  jobNo: string;
  loginTagCode: string;
  phone: string;
  titleName: string;
  userCode: string;
};

export function useSystemUsersPage() {
  const loading = ref(false);
  const submitLoading = ref(false);
  const roleSaving = ref(false);
  const logLoading = ref(false);
  const exportLoading = ref(false);
  const importLoading = ref(false);
  const pageError = ref('');

  const users = ref<SystemUser[]>([]);
  const roles = ref<RoleView[]>([]);
  const total = ref(0);

  const filters = reactive({
    enabled: undefined as boolean | undefined,
    keyword: '',
    page: 1,
    size: 10,
  });

  const userDialogVisible = ref(false);
  const userDialogMode = ref<'create' | 'edit'>('create');
  const userForm = reactive<UserFormState>({
    avatar: '',
    departmentId: '',
    departmentName: '',
    email: '',
    enabled: true,
    jobNo: '',
    loginName: '',
    loginTagCode: '',
    name: '',
    password: '',
    phone: '',
    titleName: '',
    userCode: '',
  });

  const roleDialogVisible = ref(false);
  const selectedRoleIds = ref<string[]>([]);
  const primaryRoleId = ref('');
  const activeUserId = ref('');
  const activeUserName = ref('');

  const logDrawerVisible = ref(false);
  const loginLogs = ref<UserLoginLog[]>([]);
  const logPagination = reactive({
    page: 1,
    size: 10,
    total: 0,
  });

  const printPreview = ref<null | PrintLoginTagResponse>(null);
  const printDialogVisible = ref(false);

  const roleOptions = computed(() =>
    roles.value.map((item) => ({
      label: item.roleName,
      value: item.id,
    })),
  );

  const selectedRoleOptions = computed(() =>
    roleOptions.value.filter((item) =>
      selectedRoleIds.value.includes(item.value),
    ),
  );

  const selectedRolesLabel = (user: SystemUser) =>
    user.roles.length > 0
      ? user.roles.map((item) => item.roleName).join('、')
      : '-';

  function resetUserForm() {
    Object.assign(userForm, {
      avatar: '',
      departmentId: '',
      departmentName: '',
      email: '',
      enabled: true,
      id: undefined,
      jobNo: '',
      loginName: '',
      loginTagCode: '',
      name: '',
      password: '',
      phone: '',
      titleName: '',
      userCode: '',
    });
  }

  async function loadUsers() {
    loading.value = true;
    pageError.value = '';
    try {
      const result = await listSystemUsers({
        enabled: filters.enabled,
        keyword: filters.keyword || undefined,
        page: filters.page,
        size: filters.size,
      });
      users.value = result.items;
      total.value = result.total;
    } catch (error) {
      pageError.value = getSystemPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  async function loadRoles() {
    try {
      roles.value = await listRoles();
    } catch (error) {
      pageError.value = getSystemPageErrorMessage(error);
    }
  }

  function handleSearch() {
    filters.page = 1;
    void loadUsers();
  }

  function handleReset() {
    filters.enabled = undefined;
    filters.keyword = '';
    filters.page = 1;
    filters.size = 10;
    void loadUsers();
  }

  function openCreateDialog() {
    resetUserForm();
    userDialogMode.value = 'create';
    userDialogVisible.value = true;
  }

  function openEditDialog(user: SystemUser) {
    resetUserForm();
    userDialogMode.value = 'edit';
    Object.assign(userForm, {
      avatar: user.avatar ?? '',
      departmentId: user.departmentId ?? '',
      departmentName: user.departmentName ?? '',
      email: user.email ?? '',
      enabled: user.enabled,
      id: user.id,
      jobNo: user.jobNo ?? '',
      loginName: user.loginName,
      loginTagCode: user.loginTagCode ?? '',
      name: user.name,
      phone: user.phone ?? '',
      titleName: user.titleName ?? '',
      userCode: user.userCode ?? '',
    });
    userDialogVisible.value = true;
  }

  function handleDepartmentChange(
    department: null | { id: string; name: string },
  ) {
    userForm.departmentId = department?.id ?? '';
    userForm.departmentName = department?.name ?? '';
  }

  async function submitUserForm() {
    submitLoading.value = true;
    try {
      if (userDialogMode.value === 'create') {
        await createSystemUser(buildSystemUserCreatePayload(userForm));
        ElMessage.success('用户已创建');
      } else if (userForm.id) {
        const payload: UpdateSystemUserRequest =
          buildSystemUserUpdatePayload(userForm);
        await updateSystemUser(userForm.id, payload);
        ElMessage.success('用户已更新');
      }
      userDialogVisible.value = false;
      await loadUsers();
    } finally {
      submitLoading.value = false;
    }
  }

  async function toggleUserEnabled(user: SystemUser) {
    const nextEnabled = !user.enabled;
    await ElMessageBox.confirm(
      `确认将用户“${user.name}”${nextEnabled ? '启用' : '停用'}吗？`,
      '状态确认',
      { type: 'warning' },
    );
    await updateSystemUserEnabled(user.id, nextEnabled);
    ElMessage.success('状态已更新');
    await loadUsers();
  }

  function openRoleDialog(user: SystemUser) {
    activeUserId.value = user.id;
    activeUserName.value = user.name;
    selectedRoleIds.value = user.roles.map((item) => item.roleId);
    primaryRoleId.value = user.roles.find((item) => item.primary)?.roleId ?? '';
    roleDialogVisible.value = true;
  }

  async function submitRoleAssignment() {
    roleSaving.value = true;
    try {
      await assignSystemUserRoles(
        activeUserId.value,
        selectedRoleIds.value.map((roleId) => ({
          primary: roleId === primaryRoleId.value,
          roleId,
        })),
      );
      ElMessage.success('角色分配已保存');
      roleDialogVisible.value = false;
      await loadUsers();
    } finally {
      roleSaving.value = false;
    }
  }

  async function openLogDrawer(user: SystemUser) {
    activeUserId.value = user.id;
    activeUserName.value = user.name;
    logPagination.page = 1;
    logDrawerVisible.value = true;
    await loadLoginLogs();
  }

  async function loadLoginLogs() {
    logLoading.value = true;
    try {
      const result = await listUserLoginLogs(activeUserId.value, {
        page: logPagination.page,
        size: logPagination.size,
      });
      loginLogs.value = result.items;
      logPagination.total = result.total;
    } finally {
      logLoading.value = false;
    }
  }

  async function handlePrintLoginTag(user: SystemUser) {
    printPreview.value = await printSystemUserLoginTag(user.id);
    printDialogVisible.value = true;
  }

  async function handleExport() {
    exportLoading.value = true;
    try {
      const result = await exportSystemUsers({
        enabled: filters.enabled,
        keyword: filters.keyword || undefined,
      });
      if (result instanceof Blob) {
        downloadBlobFile(result, 'system-users.csv');
        ElMessage.success('导出任务已开始');
      }
    } finally {
      exportLoading.value = false;
    }
  }

  async function handleImport(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    importLoading.value = true;
    try {
      await importSystemUsers(file);
      ElMessage.success('导入成功');
      await loadUsers();
    } finally {
      importLoading.value = false;
      target.value = '';
    }
  }

  function closePrintDialog() {
    printDialogVisible.value = false;
    printPreview.value = null;
  }

  async function loadInitialData() {
    await Promise.all([loadUsers(), loadRoles()]);
  }

  watch(selectedRoleIds, (roleIds) => {
    if (primaryRoleId.value && !roleIds.includes(primaryRoleId.value)) {
      primaryRoleId.value = '';
    }
  });

  onMounted(loadInitialData);

  return {
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
  };
}
