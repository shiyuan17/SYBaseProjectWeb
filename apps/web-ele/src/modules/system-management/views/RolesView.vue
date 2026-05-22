<script setup lang="ts">
import type {
  MenuView,
  MessageTopicView,
  PermissionView,
  RoleAuthorizationView,
  RoleView,
  StatCategoryView,
  UpdateRoleAuthorizationRequest,
  UpdateRoleRequest,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTree,
} from 'element-plus';

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
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import {
  formatDataScopeLabel,
  formatRoleTypeLabel,
  formatStatScopeLabel,
} from '../utils/authorization-display';
import { getSystemPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';
import {
  buildRoleAuthorizationPermissionGroups,
  normalizeManualPermissionIds,
} from '../utils/role-authorization';
import { buildRoleSubmitPayload } from '../utils/submit-payloads';
import { normalizeTreeCheckedKeys } from '../utils/tree';

interface MenuTreeNode extends MenuView {
  children: MenuTreeNode[];
}

interface MenuTreeCheckState {
  checkedKeys?: unknown;
}

type AuthorizationPanelKey = 'menus' | 'permissions' | 'stats' | 'topics';

const AUTHORIZATION_PANELS: Array<{
  description: string;
  key: AuthorizationPanelKey;
  label: string;
}> = [
  {
    description: '选择角色可进入的页面入口菜单，并决定哪些业务页面会出现在导航中。',
    key: 'menus',
    label: '页面入口',
  },
  {
    description: '为已选页面配置附加操作权限，基础访问权限会随页面入口自动获得。',
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
const activeRole = computed(() =>
  roles.value.find((item) => item.id === activeRoleId.value) ?? null,
);
const activeAuthorizationPanelMeta = computed<(typeof AUTHORIZATION_PANELS)[number]>(
  () =>
    AUTHORIZATION_PANELS.find((panel) => panel.key === activeAuthorizationPanel.value)
    ?? AUTHORIZATION_PANELS[0]!,
);
const permissionGroups = computed(() =>
  buildRoleAuthorizationPermissionGroups(
    menus.value,
    permissions.value,
    authState.menuIds,
  ),
);

const roleDialogVisible = ref(false);
const roleDialogMode = ref<'create' | 'edit'>('create');
const roleForm = reactive({
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

const statScopeOptions = [
  { label: '全部数据', value: 'ALL' },
  { label: '本科室', value: 'DEPARTMENT' },
  { label: '本人', value: 'SELF' },
  { label: '自定义', value: 'CUSTOM' },
];

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
    const [roleList, menuList, permissionList, topicList, statList] = await Promise.all([
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
    const hasActiveRole = roleList.some((item) => item.id === activeRoleId.value);
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
</script>

<template>
  <Page
    title="角色授权"
    description="维护角色基础信息，并按菜单、权限、消息主题和统计范围四个维度配置授权。角色编码由系统自动生成。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <SystemSectionCard title="角色列表" description="创建、维护角色，并切换右侧授权配置。">
        <template #extra>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_CREATE"
            type="primary"
            @click="openCreateDialog"
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
          @current-change="handleCurrentRoleChange"
          @row-click="handleCurrentRoleChange"
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
                  @click.stop="openEditDialog(scope.row)"
                >
                  编辑
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.SYSTEM_ROLE_CREATE"
                  link
                  type="danger"
                  @click.stop="handleDeleteRole(scope.row)"
                >
                  删除
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </SystemSectionCard>

      <div class="flex flex-col gap-4">
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
              @click="saveAuthorization"
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

        <SystemSectionCard
          :title="activeAuthorizationPanelMeta.label"
          :description="activeAuthorizationPanelMeta.description"
        >
          <ElTabs v-model="activeAuthorizationPanel" class="role-auth-tabs">
            <ElTabPane
              v-for="panel in AUTHORIZATION_PANELS"
              :key="panel.key"
              :label="panel.label"
              :name="panel.key"
            >
              <template v-if="activeRole">
                <div
                  v-if="panel.key === 'menus'"
                  v-loading="authLoading"
                  class="max-h-[560px] overflow-auto rounded-xl border border-border/60 p-4"
                >
                  <ElTree
                    :key="menuTreeReloadKey"
                    :data="menuTree"
                    :default-checked-keys="menuTreeDefaultCheckedKeys"
                    default-expand-all
                    node-key="id"
                    show-checkbox
                    :props="{ children: 'children', label: 'menuName' }"
                    @check="handleMenuCheck"
                  />
                </div>

                <div
                  v-else-if="panel.key === 'permissions'"
                  class="flex flex-col gap-4"
                >
                  <ElEmpty
                    v-if="permissionGroups.length === 0"
                    description="请先勾选页面入口菜单后，再配置页面内操作权限"
                  />
                  <ElCheckboxGroup
                    v-else
                    v-model="authState.permissionIds"
                    class="grid gap-4"
                  >
                    <div
                      v-for="group in permissionGroups"
                      :key="group.menu.id"
                      class="rounded-2xl border border-border/60 bg-background p-4"
                    >
                      <div class="flex flex-wrap items-start justify-between gap-2">
                        <div class="space-y-1">
                          <div class="font-medium text-foreground">
                            {{ group.menu.menuName }}
                          </div>
                          <div class="text-xs text-muted-foreground">
                            {{ group.menu.menuCode }}
                          </div>
                        </div>
                        <div class="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          附加权限 {{ group.manualPermissions.length }}
                        </div>
                      </div>

                      <div
                        v-if="group.entryPermissions.length > 0"
                        class="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3"
                      >
                        <div class="text-xs font-medium text-emerald-800">
                          自动生效的基础访问权限
                        </div>
                        <div class="mt-3 grid gap-2 lg:grid-cols-2">
                          <div
                            v-for="permission in group.entryPermissions"
                            :key="permission.id"
                            class="rounded-xl bg-white/90 px-3 py-3 ring-1 ring-emerald-200/70"
                          >
                            <div class="font-medium text-foreground">
                              {{ permission.permissionName }}
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                              {{ permission.permissionCode }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="mt-4">
                        <div class="text-xs font-medium text-foreground">
                          可配置的附加权限
                        </div>
                        <div
                          v-if="group.manualPermissions.length === 0"
                          class="mt-3 rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground"
                        >
                          该页面当前没有可单独配置的附加权限。
                        </div>
                        <div v-else class="mt-3 grid gap-3 lg:grid-cols-2">
                          <ElCheckbox
                            v-for="permission in group.manualPermissions"
                            :key="permission.id"
                            :label="permission.id"
                            border
                            class="!mx-0 !h-auto !items-start rounded-xl !px-4 !py-3"
                          >
                            <div class="flex flex-col gap-1 leading-5">
                              <span class="font-medium text-foreground">
                                {{ permission.permissionName }}
                              </span>
                              <span class="text-xs text-muted-foreground">
                                {{ permission.permissionCode }}
                              </span>
                            </div>
                          </ElCheckbox>
                        </div>
                      </div>
                    </div>
                  </ElCheckboxGroup>
                </div>

                <ElCheckboxGroup
                  v-else-if="panel.key === 'topics'"
                  v-model="authState.topicIds"
                  class="grid gap-3 lg:grid-cols-2"
                >
                  <ElCheckbox
                    v-for="topic in topics"
                    :key="topic.id"
                    :label="topic.id"
                    border
                    class="!mx-0 !h-auto !items-start rounded-xl !px-4 !py-3"
                  >
                    <div class="flex flex-col gap-1 leading-5">
                      <span class="font-medium text-foreground">
                        {{ topic.topicName }}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {{ topic.topicCode }}
                      </span>
                    </div>
                  </ElCheckbox>
                </ElCheckboxGroup>

                <ElTable
                  v-else
                  :data="statCategories"
                  border
                >
                  <ElTableColumn label="统计分类" min-width="220">
                    <template #default="scope">
                      <template v-if="scope?.row">
                        <div class="flex flex-col gap-1">
                          <span class="font-medium text-foreground">
                            {{ scope.row.statName }}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            {{ scope.row.statCode }}
                          </span>
                        </div>
                      </template>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="范围" min-width="220">
                    <template #default="scope">
                      <ElSelect
                        v-if="scope?.row"
                        v-model="authState.statScopes[scope.row.id]"
                        clearable
                        placeholder="请选择范围"
                      >
                        <ElOption
                          v-for="option in statScopeOptions"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </ElSelect>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="当前说明" min-width="160">
                    <template #default="scope">
                      <template v-if="scope?.row">
                        {{ formatStatScopeLabel(authState.statScopes[scope.row.id]) }}
                      </template>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </template>
              <ElEmpty v-else description="请选择角色后查看授权内容" />
            </ElTabPane>
          </ElTabs>
        </SystemSectionCard>
      </div>
    </div>

    <ElDialog
      v-model="roleDialogVisible"
      :title="roleDialogMode === 'create' ? '新增角色' : '编辑角色'"
      width="640px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="角色名称" required>
          <ElInput v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </ElFormItem>
        <ElFormItem label="角色类型">
          <ElInput v-model="roleForm.roleType" placeholder="例如 ROLE_PATHOLOGY_ADMIN" />
        </ElFormItem>
        <ElFormItem label="数据范围">
          <ElInput v-model="roleForm.dataScope" placeholder="例如 ALL / DEPARTMENT" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="roleForm.remarks"
            maxlength="500"
            placeholder="请输入备注"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="roleForm.enabled" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="roleDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitLoading" type="primary" @click="submitRoleForm">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
