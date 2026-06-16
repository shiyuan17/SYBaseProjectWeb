<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalTaskAssignmentForm,
  TechnicalTaskSelectOption,
} from '../types/technical-workflow';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { formatNullable, formatTaskType } from '../utils/format';

const props = withDefaults(
  defineProps<{
    priorityOptions: ReadonlyArray<TechnicalTaskSelectOption>;
    stationOptions: ReadonlyArray<TechnicalTaskSelectOption>;
    submitting?: boolean;
    task: null | PendingTechnicalTaskItem;
  }>(),
  {
    submitting: false,
  },
);

const emit = defineEmits<{
  submit: [];
}>();

const visible = defineModel<boolean>('visible', {
  required: true,
});

const form = defineModel<TechnicalTaskAssignmentForm>('form', {
  required: true,
});

function handleAssignedUserChange(user: null | { id: string; name: string }) {
  form.value.assignedToUserId = user?.id ?? '';
  form.value.assignedToName = user?.name ?? '';
}

function syncStationName(stationCode: string) {
  form.value.stationName =
    props.stationOptions.find((item) => item.value === stationCode)?.label ??
    '';
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    title="任务分派"
    width="640px"
  >
    <ElForm label-width="120px">
      <ElFormItem label="病理号">
        <ElInput :model-value="formatNullable(task?.pathologyNo)" disabled />
      </ElFormItem>
      <ElFormItem label="任务类型">
        <ElInput :model-value="formatTaskType(task?.taskType)" disabled />
      </ElFormItem>
      <ElFormItem label="优先级">
        <ElSelect v-model="form.priority" class="w-full">
          <ElOption
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="分派工作站">
        <ElSelect
          v-model="form.stationCode"
          class="w-full"
          @change="syncStationName"
        >
          <ElOption
            v-for="option in stationOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="责任技师">
        <SystemUserSelect
          v-model="form.assignedToUserId"
          :selected-label="form.assignedToName"
          placeholder="请选择或搜索责任技师"
          @change="handleAssignedUserChange"
        />
      </ElFormItem>
      <ElFormItem label="期望完成时间">
        <ElDatePicker
          v-model="form.expectedCompletedAt"
          class="w-full"
          placeholder="选择时间"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </ElFormItem>
      <ElFormItem label="生产备注">
        <ElInput
          v-model="form.productionRemarks"
          :rows="3"
          placeholder="特殊处理要求"
          type="textarea"
        />
      </ElFormItem>
      <ElFormItem label="操作人">
        <ElInput
          v-model="form.operatorName"
          disabled
          placeholder="当前登录人"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        确认分派
      </ElButton>
    </template>
  </ElDialog>
</template>
