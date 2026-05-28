<script setup lang="ts">
import type {
  OperatingBuildingOption,
  OperatingRoomOption,
  WorkbenchLookupType,
} from '../types/application-registration-workbench';

import {
  ElButton,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

const lookupTypeOptions: Array<{ label: string; value: WorkbenchLookupType }> = [
  { label: '住院号', value: 'INPATIENT_NO' },
  { label: '申请单号', value: 'APPLICATION_NO' },
  { label: '姓名', value: 'PATIENT_NAME' },
];

const props = defineProps<{
  buildingId: string;
  buildingOptions: OperatingBuildingOption[];
  frozenReminder: boolean;
  patientVerified: boolean;
  registrationStatus: string;
  roomId: string;
  roomOptions: OperatingRoomOption[];
  saveDisabled: boolean;
  saving: boolean;
  searchKeyword: string;
  searchType: WorkbenchLookupType;
}>();

const emit = defineEmits<{
  save: [];
  search: [];
  'update:buildingId': [value: string];
  'update:roomId': [value: string];
  'update:searchKeyword': [value: string];
  'update:searchType': [value: WorkbenchLookupType];
}>();
</script>

<template>
  <div class="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
    <div class="flex flex-col gap-2 xl:flex-row xl:flex-nowrap xl:items-center xl:gap-3">
      <div
        class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-foreground xl:flex-nowrap"
      >
        <span class="font-semibold">登记状态</span>
        <ElTag type="primary">{{ registrationStatus || '待登记' }}</ElTag>
        <ElCheckbox :model-value="patientVerified" disabled label="患者已核对" />
        <ElCheckbox :model-value="frozenReminder" disabled label="冰冻提醒" />
      </div>

      <ElForm
        class="flex w-full flex-wrap items-center gap-2 xl:min-w-0 xl:flex-1 xl:flex-nowrap [&_.el-form-item]:!mb-0"
        label-width="0"
        size="small"
      >
        <ElFormItem class="!mr-0">
          <ElSelect
            :model-value="props.buildingId"
            class="!w-[140px]"
            placeholder="手术楼"
            @update:model-value="emit('update:buildingId', $event)"
          >
            <ElOption
              v-for="option in props.buildingOptions"
              :key="option.buildingId"
              :label="option.buildingName"
              :value="option.buildingId"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="!mr-0">
          <ElSelect
            :model-value="props.roomId"
            class="!w-[150px]"
            placeholder="手术室"
            @update:model-value="emit('update:roomId', $event)"
          >
            <ElOption
              v-for="option in props.roomOptions"
              :key="option.roomId"
              :label="option.roomName"
              :value="option.roomId"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="!mr-0">
          <ElSelect
            :model-value="props.searchType"
            class="!w-[112px]"
            @update:model-value="emit('update:searchType', $event)"
          >
            <ElOption
              v-for="option in lookupTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="min-w-0 !mr-0">
          <ElInput
            :model-value="props.searchKeyword"
            class="!w-[240px]"
            clearable
            :placeholder="
              props.searchType === 'APPLICATION_NO'
                ? '请输入申请单号'
                : props.searchType === 'PATIENT_NAME'
                  ? '请输入姓名'
                  : '请输入住院号'
            "
            @keyup.enter="emit('search')"
            @update:model-value="emit('update:searchKeyword', $event)"
          />
        </ElFormItem>

        <ElFormItem class="!mr-0">
          <ElButton type="primary" @click="emit('search')">查询</ElButton>
        </ElFormItem>

        <ElFormItem class="!mr-0">
          <ElButton
            :disabled="saveDisabled"
            :loading="saving"
            type="success"
            @click="emit('save')"
          >
            保存/确认登记
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>
