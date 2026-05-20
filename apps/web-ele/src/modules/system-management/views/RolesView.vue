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

import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue';

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
import { getSystemPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

interface MenuTreeNode extends MenuView {
  children: MenuTreeNode[];
}

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
const menuTreeRef = useTemplateRef<any>('menuTreeRef');

const activeRoleId = ref('');
const activeRole = computed(() =>
  roles.value.find((item) => item.id === activeRoleId.value) ?? null,
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
  { label: '全部', value: 'ALL' },
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
    if (!activeRoleId.value && firstRole) {
      activeRoleId.value = firstRole.id;
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
    authState.menuIds = authorization.menuIds;
    authState.permissionIds = authorization.permissionIds;
    authState.topicIds = authorization.topicIds;
    authState.statScopes = { ...authorization.statScopes };
    await nextTick();
    menuTreeRef.value?.setCheckedKeys(authorization.menuIds);
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  } finally {
    authLoading.value = false;
  }
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
    if (roleDialogMode.value === 'create') {
      await createRole({
        dataScope: roleForm.dataScope || null,
        enabled: roleForm.enabled,
        remarks: roleForm.remarks || null,
        roleCode: roleForm.roleCode,
        roleName: roleForm.roleName,
        roleType: roleForm.roleType || null,
      });
      ElMessage.success('角色已创建');
    } else {
      await updateRole(roleForm.id, {
        dataScope: roleForm.dataScope || null,
        enabled: roleForm.enabled,
        remarks: roleForm.remarks || null,
        roleCode: roleForm.roleCode,
        roleName: roleForm.roleName,
        roleType: roleForm.roleType || null,
      } satisfies UpdateRoleRequest);
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
  const firstRole = roles.value[0];
  if (firstRole) {
    activeRoleId.value = firstRole.id;
    await loadRoleAuthorization(activeRoleId.value);
  }
}

async function handleRoleChange(roleId: string) {
  activeRoleId.value = roleId;
  await loadRoleAuthorization(roleId);
}

function handleCurrentRoleChange(role?: RoleView) {
  if (role) {
    void handleRoleChange(role.id);
  }
}

async function saveAuthorization() {
  if (!activeRoleId.value) {
    return;
  }
  authSaving.value = true;
  try {
    const payload: UpdateRoleAuthorizationRequest = {
      menuIds: menuTreeRef.value?.getCheckedKeys(false) ?? [],
      permissionIds: authState.permissionIds,
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
    description="维护角色基础信息、菜单权限、消息主题和统计范围授权。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
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
          :data="roles"
          border
          highlight-current-row
          @current-change="handleCurrentRoleChange"
          @row-click="handleCurrentRoleChange"
        >
          <ElTableColumn label="角色名称" min-width="140" prop="roleName" />
          <ElTableColumn label="角色编码" min-width="150" prop="roleCode" />
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
          title="角色信息"
          description="展示当前角色基础信息，授权保存按四个维度拆分为菜单、权限、消息主题和统计范围。"
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
            <ElDescriptionsItem label="角色编码">
              {{ activeRole.roleCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="角色类型">
              {{ formatNullable(activeRole.roleType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="数据范围">
              {{ formatNullable(activeRole.dataScope) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <SystemStatusTag :enabled="activeRole.enabled" />
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

        <div class="grid gap-4 2xl:grid-cols-2">
          <SystemSectionCard title="菜单授权" description="角色可见菜单与页面入口控制。">
            <ElTree
              v-if="activeRole"
              ref="menuTreeRef"
              v-loading="authLoading"
              :data="menuTree"
              default-expand-all
              node-key="id"
              show-checkbox
              :props="{ children: 'children', label: 'menuName' }"
            />
            <ElEmpty v-else description="请选择角色后查看授权" />
          </SystemSectionCard>

          <SystemSectionCard title="权限授权" description="控制页面内按钮与接口动作权限码。">
            <ElCheckboxGroup v-if="activeRole" v-model="authState.permissionIds" class="grid gap-2">
              <ElCheckbox
                v-for="permission in permissions"
                :key="permission.id"
                :label="permission.id"
              >
                {{ permission.permissionName }} ({{ permission.permissionCode }})
              </ElCheckbox>
            </ElCheckboxGroup>
            <ElEmpty v-else description="请选择角色后查看授权" />
          </SystemSectionCard>

          <SystemSectionCard title="消息主题" description="控制角色可订阅或处理的消息主题。">
            <ElCheckboxGroup v-if="activeRole" v-model="authState.topicIds" class="grid gap-2">
              <ElCheckbox v-for="topic in topics" :key="topic.id" :label="topic.id">
                {{ topic.topicName }} ({{ topic.topicCode }})
              </ElCheckbox>
            </ElCheckboxGroup>
            <ElEmpty v-else description="请选择角色后查看授权" />
          </SystemSectionCard>

          <SystemSectionCard title="统计范围" description="为每个统计分类保存角色级的默认统计视角。">
            <ElTable v-if="activeRole" :data="statCategories" border>
              <ElTableColumn label="统计分类" min-width="180">
                <template #default="scope">
                  <template v-if="scope?.row">
                    {{ scope.row.statName }} ({{ scope.row.statCode }})
                  </template>
                </template>
              </ElTableColumn>
              <ElTableColumn label="范围" min-width="180">
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
            </ElTable>
            <ElEmpty v-else description="请选择角色后查看授权" />
          </SystemSectionCard>
        </div>
      </div>
    </div>

    <ElDialog
      v-model="roleDialogVisible"
      :title="roleDialogMode === 'create' ? '新增角色' : '编辑角色'"
      width="640px"
    >
      <ElForm label-width="96px">
        <ElFormItem label="角色编码" required>
          <ElInput v-model="roleForm.roleCode" placeholder="请输入角色编码" />
        </ElFormItem>
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
