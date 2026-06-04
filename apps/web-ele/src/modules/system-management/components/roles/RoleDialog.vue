<script setup lang="ts">
import type { RoleFormState } from '../../composables/useRolesPage';

import { computed } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
} from 'element-plus';

const props = defineProps<{
  mode: 'create' | 'edit';
  modelValue: boolean;
  roleForm: RoleFormState;
  submitLoading: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:modelValue': [value: boolean];
  'update:roleForm': [value: RoleFormState];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function createRoleFormModel<Key extends keyof RoleFormState>(key: Key) {
  return computed({
    get: () => props.roleForm[key],
    set: (value: RoleFormState[Key]) =>
      emit('update:roleForm', { ...props.roleForm, [key]: value }),
  });
}

const roleNameModel = createRoleFormModel('roleName');
const roleTypeModel = createRoleFormModel('roleType');
const dataScopeModel = createRoleFormModel('dataScope');
const remarksModel = createRoleFormModel('remarks');
const enabledModel = createRoleFormModel('enabled');
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新增角色' : '编辑角色'"
    width="640px"
  >
    <ElForm label-width="96px">
      <ElFormItem label="角色名称" required>
        <ElInput v-model="roleNameModel" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem label="角色类型">
        <ElInput
          v-model="roleTypeModel"
          placeholder="例如 ROLE_PATHOLOGY_ADMIN"
        />
      </ElFormItem>
      <ElFormItem label="数据范围">
        <ElInput v-model="dataScopeModel" placeholder="例如 ALL / DEPARTMENT" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="remarksModel"
          maxlength="500"
          placeholder="请输入备注"
          type="textarea"
        />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSwitch v-model="enabledModel" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitLoading" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
