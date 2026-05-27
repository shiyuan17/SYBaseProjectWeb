<script setup lang="ts">
import type {
  OperatingBuildingOption,
  OperatingRoomOption,
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
}>();

const emit = defineEmits<{
  save: [];
  search: [];
  'update:buildingId': [value: string];
  'update:roomId': [value: string];
  'update:searchKeyword': [value: string];
}>();
</script>

<template>
  <div class="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
    <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-foreground">
        <span class="font-semibold">登记状态</span>
        <ElTag type="primary">{{ registrationStatus || '待登记' }}</ElTag>
        <ElCheckbox :model-value="patientVerified" disabled label="患者已核对" />
        <ElCheckbox :model-value="frozenReminder" disabled label="冰冻提醒" />
      </div>

      <ElForm class="w-full xl:w-auto" inline label-width="auto" size="small">
        <ElFormItem label="手术楼">
          <ElSelect
            :model-value="props.buildingId"
            class="!w-[140px]"
            placeholder="请选择手术楼"
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

        <ElFormItem label="手术室">
          <ElSelect
            :model-value="props.roomId"
            class="!w-[150px]"
            placeholder="请选择手术室"
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

        <ElFormItem label="查询">
          <ElInput
            :model-value="props.searchKeyword"
            class="!w-[240px]"
            clearable
            placeholder="申请单编号 / 申请单号 / 住院号"
            @keyup.enter="emit('search')"
            @update:model-value="emit('update:searchKeyword', $event)"
          />
        </ElFormItem>

        <ElFormItem>
          <ElButton type="primary" @click="emit('search')">查询</ElButton>
        </ElFormItem>

        <ElFormItem>
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
