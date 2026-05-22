<script setup lang="ts">
import type {
  CreateSystemUserRequest,
  PrintLoginTagResponse,
  RoleView,
  SystemUser,
  UpdateSystemUserRequest,
  UserLoginLog,
} from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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
import DepartmentSelect from '../components/DepartmentSelect.vue';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES, YES_NO_OPTIONS } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

type UserFormState = Omit<
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
const importInputRef = ref<HTMLInputElement>();

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

const selectedRolesLabel = (user: SystemUser) =>
  user.roles.length > 0 ? user.roles.map((item) => item.roleName).join('、') : '-';

const roleOptions = computed(() =>
  roles.value.map((item) => ({
    label: item.roleName,
    value: item.id,
  })),
);

const selectedRoleOptions = computed(() =>
  roleOptions.value.filter((item) => selectedRoleIds.value.includes(item.value)),
);

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

function handleDepartmentChange(department: null | { id: string; name: string }) {
  userForm.departmentId = department?.id ?? '';
  userForm.departmentName = department?.name ?? '';
}

async function submitUserForm() {
  submitLoading.value = true;
  try {
    if (userDialogMode.value === 'create') {
      await createSystemUser({
        avatar: userForm.avatar || null,
        departmentId: userForm.departmentId || null,
        departmentName: userForm.departmentName || null,
        email: userForm.email || null,
        enabled: userForm.enabled,
        jobNo: userForm.jobNo || null,
        loginName: userForm.loginName,
        loginTagCode: userForm.loginTagCode || null,
        name: userForm.name,
        password: userForm.password || null,
        phone: userForm.phone || null,
        titleName: userForm.titleName || null,
        userCode: userForm.userCode || null,
      });
      ElMessage.success('用户已创建');
    } else if (userForm.id) {
      const payload: UpdateSystemUserRequest = {
        avatar: userForm.avatar || null,
        departmentId: userForm.departmentId || null,
        departmentName: userForm.departmentName || null,
        email: userForm.email || null,
        enabled: userForm.enabled,
        jobNo: userForm.jobNo || null,
        loginTagCode: userForm.loginTagCode || null,
        name: userForm.name,
        phone: userForm.phone || null,
        titleName: userForm.titleName || null,
        userCode: userForm.userCode || null,
      };
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

watch(selectedRoleIds, (roleIds) => {
  if (primaryRoleId.value && !roleIds.includes(primaryRoleId.value)) {
    primaryRoleId.value = '';
  }
});

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

function saveDownloadedBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await exportSystemUsers({
      enabled: filters.enabled,
      keyword: filters.keyword || undefined,
    });
    if (result instanceof Blob) {
      saveDownloadedBlob(result, 'system-users.csv');
      ElMessage.success('导出任务已开始');
    }
  } finally {
    exportLoading.value = false;
  }
}

function triggerImport() {
  importInputRef.value?.click();
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

async function loadInitialData() {
  await Promise.all([loadUsers(), loadRoles()]);
}

onMounted(loadInitialData);
</script>

<template>
  <Page
    title="系统用户"
    description="维护系统用户、角色分配、登录日志、导入导出与登录标签。"
  >
    <SystemLoadError
      v-if="pageError"
      :message="pageError"
      class="mb-4"
      @retry="loadInitialData"
    />
    <div class="flex flex-col gap-4">
      <SystemSectionCard title="筛选条件" description="支持关键字、启停状态与分页查询。">
        <ElForm inline label-width="72px">
          <ElFormItem label="关键字">
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="姓名 / 登录名 / 工号"
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect
              v-model="filters.enabled"
              clearable
              placeholder="全部状态"
              style="width: 160px"
            >
              <ElOption
                v-for="option in YES_NO_OPTIONS"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </SystemSectionCard>

      <SystemSectionCard title="用户列表" description="支持新增、编辑、启停、角色分配和登录日志查看。">
        <template #extra>
          <input
            ref="importInputRef"
            accept=".xls,.xlsx"
            class="hidden"
            type="file"
            @change="handleImport"
          />
          <ElButton
            v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_CREATE"
            :loading="importLoading"
            @click="triggerImport"
          >
            导入
          </ElButton>
          <ElButton :loading="exportLoading" @click="handleExport">导出</ElButton>
          <ElButton
            v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_CREATE"
            type="primary"
            @click="openCreateDialog"
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
                  @click="openEditDialog(scope.row)"
                >
                  编辑
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
                  link
                  type="primary"
                  @click="toggleUserEnabled(scope.row)"
                >
                  {{ scope.row.enabled ? '停用' : '启用' }}
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
                  link
                  type="primary"
                  @click="openRoleDialog(scope.row)"
                >
                  分配角色
                </ElButton>
                <ElButton link type="primary" @click="openLogDrawer(scope.row)">
                  登录日志
                </ElButton>
                <ElButton
                  v-access:code="M1_PERMISSION_CODES.SYSTEM_USER_UPDATE"
                  link
                  type="primary"
                  @click="handlePrintLoginTag(scope.row)"
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
            @current-change="loadUsers"
            @size-change="loadUsers"
          />
        </div>
      </SystemSectionCard>
    </div>

    <ElDialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'create' ? '新增用户' : '编辑用户'"
      width="720px"
    >
      <ElForm label-width="96px">
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="登录名" required>
            <ElInput
              v-model="userForm.loginName"
              :disabled="userDialogMode === 'edit'"
              placeholder="请输入登录名"
            />
          </ElFormItem>
          <ElFormItem v-if="userDialogMode === 'create'" label="初始密码">
            <ElInput v-model="userForm.password" placeholder="留空则按后端默认策略" />
          </ElFormItem>
          <ElFormItem label="姓名" required>
            <ElInput v-model="userForm.name" placeholder="请输入姓名" />
          </ElFormItem>
          <ElFormItem label="用户编码">
            <ElInput v-model="userForm.userCode" placeholder="请输入用户编码" />
          </ElFormItem>
          <ElFormItem label="工号">
            <ElInput v-model="userForm.jobNo" placeholder="请输入工号" />
          </ElFormItem>
          <ElFormItem label="职称">
            <ElInput v-model="userForm.titleName" placeholder="请输入职称" />
          </ElFormItem>
          <ElFormItem label="所属科室">
            <DepartmentSelect
              v-model="userForm.departmentId"
              :selected-label="userForm.departmentName || ''"
              placeholder="请选择所属科室"
              @change="handleDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="手机号">
            <ElInput v-model="userForm.phone" placeholder="请输入手机号" />
          </ElFormItem>
          <ElFormItem label="邮箱">
            <ElInput v-model="userForm.email" placeholder="请输入邮箱" />
          </ElFormItem>
          <ElFormItem label="头像地址">
            <ElInput v-model="userForm.avatar" placeholder="请输入头像 URL" />
          </ElFormItem>
          <ElFormItem label="登录标签">
            <ElInput v-model="userForm.loginTagCode" placeholder="请输入登录标签编码" />
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSwitch v-model="userForm.enabled" />
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="userDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitLoading" type="primary" @click="submitUserForm">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="roleDialogVisible" title="分配角色" width="960px">
      <div class="space-y-5">
        <div class="rounded-xl border border-border bg-card px-4 py-3">
          <div class="text-sm text-muted-foreground">当前用户</div>
          <div class="mt-1 text-base font-medium text-foreground">{{ activeUserName }}</div>
        </div>

        <ElForm label-position="top" class="space-y-5">
          <ElFormItem class="!mb-0">
            <template #label>
              <div class="flex w-full items-center justify-between">
                <span>角色列表</span>
                <span class="text-xs font-normal text-muted-foreground">
                  已选 {{ selectedRoleIds.length }} / {{ roleOptions.length }}
                </span>
              </div>
            </template>
            <div class="w-full rounded-xl border border-border/60 bg-card p-4">
              <ElCheckboxGroup
                v-model="selectedRoleIds"
                class="grid max-h-[320px] gap-3 overflow-y-auto pr-1 md:grid-cols-3"
              >
                <ElCheckbox
                  v-for="option in roleOptions"
                  :key="option.value"
                  :label="option.value"
                  border
                  class="!mx-0 !h-auto !items-start rounded-xl !px-4 !py-3"
                >
                  <span class="font-medium leading-5 text-foreground">
                    {{ option.label }}
                  </span>
                </ElCheckbox>
              </ElCheckboxGroup>
            </div>
          </ElFormItem>
          <ElFormItem class="!mb-0" label="主角色">
            <ElSelect
              v-model="primaryRoleId"
              :disabled="selectedRoleIds.length === 0"
              clearable
              placeholder="请选择主角色"
              style="width: 100%"
            >
              <ElOption
                v-for="option in selectedRoleOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <div class="mt-2 text-xs text-muted-foreground">
              主角色用于标记用户当前默认身份，请先在上方勾选候选角色。
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <template #footer>
        <ElButton @click="roleDialogVisible = false">取消</ElButton>
        <ElButton :loading="roleSaving" type="primary" @click="submitRoleAssignment">
          保存角色
        </ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="logDrawerVisible" :title="`${activeUserName} 的登录日志`" size="58%">
      <ElTable v-loading="logLoading" :data="loginLogs" border>
        <ElTableColumn label="登录时间" min-width="160">
          <template #default="scope">
            {{ formatDateTime(scope?.row?.loginAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="结果" min-width="100" prop="loginResult" />
        <ElTableColumn label="IP" min-width="140">
          <template #default="scope">
            {{ formatNullable(scope?.row?.clientIp) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="终端" min-width="180">
          <template #default="scope">
            {{ formatNullable(scope?.row?.clientDevice) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="失败原因" min-width="180">
          <template #default="scope">
            {{ formatNullable(scope?.row?.failureReason) }}
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="logPagination.page"
          v-model:page-size="logPagination.size"
          :total="logPagination.total"
          background
          layout="total, prev, pager, next"
          @current-change="loadLoginLogs"
          @size-change="loadLoginLogs"
        />
      </div>
    </ElDrawer>

    <ElDialog v-model="printDialogVisible" title="登录标签预览" width="560px">
      <template v-if="printPreview">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="标题">
            {{ printPreview.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标签编码">
            {{ printPreview.loginTagCode }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="内容">
            <pre class="text-foreground whitespace-pre-wrap text-sm">{{ printPreview.content }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>
      </template>
      <template #footer>
        <ElButton
          @click="
            printDialogVisible = false;
            printPreview = null;
          "
        >
          关闭
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
