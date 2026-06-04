import type {
  MenuView,
  MessageTopicView,
  PermissionView,
  RoleAuthorizationView,
  RoleView,
  StatCategoryView,
  UpdateRoleAuthorizationRequest,
  UpdateRoleRequest,
} from '../types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  createRole,
  deleteRole,
  getRoleAuthorization,
  listMenus,
  listMessageTopics,
  listPermissions,
  listRoles,
  listStatCategories,
  updateRole,
  updateRoleAuthorization,
} from '../api/system-management-service';
import {
  formatDataScopeLabel,
  formatRoleTypeLabel,
  formatStatScopeLabel,
} from '../utils/authorization-display';
import { getSystemPageErrorMessage } from '../utils/error';
import {
  buildRoleAuthorizationPermissionGroups,
  normalizeManualPermissionIds,
} from '../utils/role-authorization';
import { buildRoleSubmitPayload } from '../utils/submit-payloads';
import { normalizeTreeCheckedKeys } from '../utils/tree';

export interface MenuTreeNode extends MenuView {
  children: MenuTreeNode[];
}

export interface MenuTreeCheckState {
  checkedKeys?: unknown;
}

export type AuthorizationPanelKey =
  | 'menus'
  | 'permissions'
  | 'stats'
  | 'topics';

export type RoleFormState = {
  dataScope: string;
  enabled: boolean;
  id: string;
  remarks: string;
  roleCode: string;
  roleName: string;
  roleType: string;
};

type AuthorizationPanelMeta = {
  description: string;
  key: AuthorizationPanelKey;
  label: string;
};

const DEFAULT_AUTHORIZATION_PANEL: AuthorizationPanelMeta = {
  description:
    '选择角色可进入的页面入口菜单，并决定哪些业务页面会出现在导航中。',
  key: 'menus',
  label: '页面入口',
};

export const AUTHORIZATION_PANELS: AuthorizationPanelMeta[] = [
  DEFAULT_AUTHORIZATION_PANEL,
  {
    description:
      '为已选页面配置附加操作权限，基础访问权限会随页面入口自动获得。',
    key: 'permissions',
    label: '页面操作',
  },
  {
    description: '为角色配置可订阅或处理的消息主题。',
    key: 'topics',
    label: '消息主题',
  },
  {
    description: '为统计分类设置默认可见范围。',
    key: 'stats',
    label: '统计范围',
  },
];

export const STAT_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'ALL' },
  { label: '本科室', value: 'DEPARTMENT' },
  { label: '本人', value: 'SELF' },
  { label: '自定义', value: 'CUSTOM' },
];

export function useRolesPage() {
  const loading = ref(false);
  const authLoading = ref(false);
  const submitLoading = ref(false);
  const authSaving = ref(false);
  const pageError = ref('');

  const roles = ref<RoleView[]>([]);
  const menus = ref<MenuView[]>([]);
  const permissions = ref<PermissionView[]>([]);
  const topics = ref<MessageTopicView[]>([]);
  const statCategories = ref<StatCategoryView[]>([]);
  const activeAuthorizationPanel = ref<AuthorizationPanelKey>('menus');
  const menuTreeDefaultCheckedKeys = ref<string[]>([]);
  const menuTreeReloadKey = ref(0);

  const activeRoleId = ref('');
  const activeRole = computed(
    () => roles.value.find((item) => item.id === activeRoleId.value) ?? null,
  );

  const activeAuthorizationPanelMeta = computed(
    () =>
      AUTHORIZATION_PANELS.find(
        (panel) => panel.key === activeAuthorizationPanel.value,
      ) ?? DEFAULT_AUTHORIZATION_PANEL,
  );

  const roleDialogVisible = ref(false);
  const roleDialogMode = ref<'create' | 'edit'>('create');
  const roleForm = reactive<RoleFormState>({
    dataScope: '',
    enabled: true,
    id: '',
    remarks: '',
    roleCode: '',
    roleName: '',
    roleType: '',
  });

  const authState = reactive<RoleAuthorizationView>({
    menuIds: [],
    permissionIds: [],
    roleId: '',
    statScopes: {},
    topicIds: [],
  });

  const menuTree = computed<MenuTreeNode[]>(() => {
    const nodeMap = new Map<string, MenuTreeNode>();
    menus.value.forEach((menu) => {
      nodeMap.set(menu.id, { ...menu, children: [] });
    });

    const roots: MenuTreeNode[] = [];
    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  });

  const permissionGroups = computed(() =>
    buildRoleAuthorizationPermissionGroups(
      menus.value,
      permissions.value,
      authState.menuIds,
    ),
  );

  function resetRoleForm() {
    Object.assign(roleForm, {
      dataScope: '',
      enabled: true,
      id: '',
      remarks: '',
      roleCode: '',
      roleName: '',
      roleType: '',
    });
  }

  function syncMenuAuthorization(menuIds: string[]) {
    const normalizedMenuIds = normalizeTreeCheckedKeys(menuIds);

    authState.menuIds = normalizedMenuIds;
    menuTreeDefaultCheckedKeys.value = normalizedMenuIds;
    menuTreeReloadKey.value += 1;
  }

  function syncManualPermissionAuthorization() {
    authState.permissionIds = normalizeManualPermissionIds(
      permissions.value,
      authState.menuIds,
      authState.permissionIds,
    );
  }

  async function loadRolesData() {
    loading.value = true;
    pageError.value = '';
    try {
      const [roleList, menuList, permissionList, topicList, statList] =
        await Promise.all([
          listRoles(),
          listMenus(),
          listPermissions(),
          listMessageTopics(),
          listStatCategories(),
        ]);
      roles.value = roleList;
      menus.value = menuList;
      permissions.value = permissionList;
      topics.value = topicList;
      statCategories.value = statList;

      const firstRole = roleList[0];
      const hasActiveRole = roleList.some(
        (item) => item.id === activeRoleId.value,
      );
      if (!hasActiveRole) {
        activeRoleId.value = firstRole?.id ?? '';
      }
    } catch (error) {
      pageError.value = getSystemPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  async function loadRoleAuthorization(roleId: string) {
    if (!roleId) {
      return;
    }
    authLoading.value = true;
    try {
      const authorization = await getRoleAuthorization(roleId);
      authState.roleId = authorization.roleId;
      syncMenuAuthorization(authorization.menuIds);
      authState.permissionIds = authorization.permissionIds;
      syncManualPermissionAuthorization();
      authState.topicIds = authorization.topicIds;
      authState.statScopes = { ...authorization.statScopes };
    } catch (error) {
      pageError.value = getSystemPageErrorMessage(error);
    } finally {
      authLoading.value = false;
    }
  }

  function handleMenuCheck(_: MenuTreeNode, checkedState: MenuTreeCheckState) {
    authState.menuIds = normalizeTreeCheckedKeys(checkedState.checkedKeys);
    syncManualPermissionAuthorization();
  }

  function openCreateDialog() {
    resetRoleForm();
    roleDialogMode.value = 'create';
    roleDialogVisible.value = true;
  }

  function openEditDialog(role: RoleView) {
    resetRoleForm();
    roleDialogMode.value = 'edit';
    Object.assign(roleForm, {
      dataScope: role.dataScope ?? '',
      enabled: role.enabled,
      id: role.id,
      remarks: role.remarks ?? '',
      roleCode: role.roleCode,
      roleName: role.roleName,
      roleType: role.roleType ?? '',
    });
    roleDialogVisible.value = true;
  }

  async function submitRoleForm() {
    submitLoading.value = true;
    try {
      const payload = buildRoleSubmitPayload(roleForm, roleDialogMode.value);
      if (roleDialogMode.value === 'create') {
        await createRole(payload);
        ElMessage.success('角色已创建');
      } else {
        await updateRole(roleForm.id, payload as UpdateRoleRequest);
        ElMessage.success('角色已更新');
      }
      roleDialogVisible.value = false;
      await loadRolesData();
    } finally {
      submitLoading.value = false;
    }
  }

  async function handleDeleteRole(role: RoleView) {
    await deleteRole(role.id);
    ElMessage.success('角色已删除');
    if (activeRoleId.value === role.id) {
      activeRoleId.value = '';
    }
    await loadRolesData();
    if (activeRoleId.value) {
      await loadRoleAuthorization(activeRoleId.value);
    }
  }

  async function handleRoleChange(roleId: string) {
    activeRoleId.value = roleId;
    await loadRoleAuthorization(roleId);
  }

  function handleCurrentRoleChange(role?: RoleView) {
    if (role && role.id !== activeRoleId.value) {
      void handleRoleChange(role.id);
    }
  }

  async function saveAuthorization() {
    if (!activeRoleId.value) {
      return;
    }
    authSaving.value = true;
    try {
      syncManualPermissionAuthorization();
      const payload: UpdateRoleAuthorizationRequest = {
        menuIds: authState.menuIds,
        permissionIds: [...authState.permissionIds],
        statScopes: authState.statScopes,
        topicIds: authState.topicIds,
      };
      await updateRoleAuthorization(activeRoleId.value, payload);
      ElMessage.success('授权已保存');
      await loadRoleAuthorization(activeRoleId.value);
    } finally {
      authSaving.value = false;
    }
  }

  async function loadInitialData() {
    await loadRolesData();
    if (activeRoleId.value) {
      await loadRoleAuthorization(activeRoleId.value);
    }
  }

  onMounted(loadInitialData);

  return {
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
  };
}
