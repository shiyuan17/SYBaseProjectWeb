<script setup lang="ts">
import type { UserFormState } from '../../composables/useSystemUsersPage';

import { computed } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
} from 'element-plus';

import DepartmentSelect from '../DepartmentSelect.vue';

const props = defineProps<{
  mode: 'create' | 'edit';
  modelValue: boolean;
  submitLoading: boolean;
  userForm: UserFormState;
}>();

const emit = defineEmits<{
  departmentChange: [department: null | { id: string; name: string }];
  submit: [];
  'update:modelValue': [value: boolean];
  'update:userForm': [value: UserFormState];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function createUserFormModel<Key extends keyof UserFormState>(key: Key) {
  return computed({
    get: () => props.userForm[key],
    set: (value: UserFormState[Key]) =>
      emit('update:userForm', { ...props.userForm, [key]: value }),
  });
}

const loginNameModel = createUserFormModel('loginName');
const passwordModel = createUserFormModel('password');
const nameModel = createUserFormModel('name');
const jobNoModel = createUserFormModel('jobNo');
const titleNameModel = createUserFormModel('titleName');
const departmentIdModel = createUserFormModel('departmentId');
const phoneModel = createUserFormModel('phone');
const emailModel = createUserFormModel('email');
const avatarModel = createUserFormModel('avatar');
const enabledModel = createUserFormModel('enabled');
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增用户' : '编辑用户'"
    width="720px"
  >
    <ElForm label-width="96px">
      <div class="grid gap-4 md:grid-cols-2">
        <ElFormItem label="登录名" required>
          <ElInput
            v-model="loginNameModel"
            :disabled="mode === 'edit'"
            placeholder="请输入登录名"
          />
        </ElFormItem>
        <ElFormItem v-if="mode === 'create'" label="初始密码">
          <ElInput v-model="passwordModel" placeholder="留空则按后端默认策略" />
        </ElFormItem>
        <ElFormItem label="姓名" required>
          <ElInput v-model="nameModel" placeholder="请输入姓名" />
        </ElFormItem>
        <ElFormItem label="工号">
          <ElInput v-model="jobNoModel" placeholder="请输入工号" />
        </ElFormItem>
        <ElFormItem label="职称">
          <ElInput v-model="titleNameModel" placeholder="请输入职称" />
        </ElFormItem>
        <ElFormItem label="所属科室">
          <DepartmentSelect
            v-model="departmentIdModel"
            :selected-label="userForm.departmentName || ''"
            placeholder="请选择所属科室"
            @change="emit('departmentChange', $event)"
          />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="phoneModel" placeholder="请输入手机号" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="emailModel" placeholder="请输入邮箱" />
        </ElFormItem>
        <ElFormItem label="头像地址">
          <ElInput v-model="avatarModel" placeholder="请输入头像 URL" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="enabledModel" />
        </ElFormItem>
      </div>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitLoading" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
