<script setup lang="ts">
import { computed } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
} from 'element-plus';

const props = defineProps<{
  activeUserName: string;
  modelValue: boolean;
  primaryRoleId: string;
  roleOptions: Array<{ label: string; value: string }>;
  roleSaving: boolean;
  selectedRoleIds: string[];
  selectedRoleOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  submit: [];
  'update:modelValue': [value: boolean];
  'update:primaryRoleId': [value: string];
  'update:selectedRoleIds': [value: string[]];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const selectedRoleIdsModel = computed({
  get: () => props.selectedRoleIds,
  set: (value: string[]) => emit('update:selectedRoleIds', value),
});

const primaryRoleIdModel = computed({
  get: () => props.primaryRoleId,
  set: (value: string) => emit('update:primaryRoleId', value),
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="分配角色" width="960px">
    <div class="space-y-5">
      <div class="rounded-xl border border-border bg-card px-4 py-3">
        <div class="text-sm text-muted-foreground">当前用户</div>
        <div class="mt-1 text-base font-medium text-foreground">
          {{ activeUserName }}
        </div>
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
              v-model="selectedRoleIdsModel"
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
            v-model="primaryRoleIdModel"
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
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="roleSaving" type="primary" @click="emit('submit')">
        保存角色
      </ElButton>
    </template>
  </ElDialog>
</template>
