<script setup lang="ts">
import type {
  EquipmentCommonDeviceView,
  EquipmentUsageRecordFormState,
} from '../utils/equipment-usage-record';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { EQUIPMENT_CATEGORY_OPTIONS } from '../constants';

const props = defineProps<{
  commonDevices: EquipmentCommonDeviceView[];
  loadingCommonDevices: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'applyCommonDevice', row: EquipmentCommonDeviceView): void;
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const usageRecordForm = defineModel<EquipmentUsageRecordFormState>(
  'usageRecordForm',
  { required: true },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="新增设备使用记录"
    top="3vh"
    width="1024px"
  >
    <ElForm label-width="96px">
      <div class="grid gap-x-10 gap-y-2 lg:grid-cols-2">
        <div>
          <ElFormItem label="设备类型" required>
            <ElSelect
              v-model="usageRecordForm.equipmentCategory"
              allow-create
              clearable
              default-first-option
              filterable
              placeholder="全部"
            >
              <ElOption
                v-for="option in EQUIPMENT_CATEGORY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="设为常用设备">
            <ElRadioGroup v-model="usageRecordForm.commonlyUsed">
              <ElRadio :value="true">是</ElRadio>
              <ElRadio :value="false">否</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="运行时长(h)">
            <ElInputNumber
              v-model="usageRecordForm.runtimeHours"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="诊治数量">
            <ElInputNumber
              v-model="usageRecordForm.diagnosisCount"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="使用人" required>
            <ElInput v-model="usageRecordForm.operatorName" />
          </ElFormItem>
        </div>

        <div>
          <ElFormItem label="设备名称" required>
            <ElInput v-model="usageRecordForm.equipmentName" />
          </ElFormItem>
          <ElFormItem label="开机时间" required>
            <ElDatePicker
              v-model="usageRecordForm.startedAt"
              format="YYYY/M/D HH:mm:ss"
              placeholder="选择开机时间"
              style="width: 100%"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="关机时间" required>
            <ElDatePicker
              v-model="usageRecordForm.endedAt"
              format="YYYY/M/D HH:mm:ss"
              placeholder="选择关机时间"
              style="width: 100%"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="设备状况" required>
            <ElInput v-model="usageRecordForm.equipmentCondition" />
          </ElFormItem>
          <ElFormItem label="使用内容">
            <ElInput v-model="usageRecordForm.usageContent" />
          </ElFormItem>
        </div>
      </div>

      <ElFormItem label="备注">
        <ElInput
          v-model="usageRecordForm.remarks"
          :rows="4"
          resize="none"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>

    <section class="mt-4">
      <div
        class="mb-3 text-[28px] font-semibold leading-none text-[var(--el-text-color-primary)]"
      >
        常用设备列表：
      </div>
      <ElTable
        v-loading="props.loadingCommonDevices"
        :data="props.commonDevices"
        border
        max-height="240"
        row-key="equipmentId"
      >
        <ElTableColumn type="selection" width="40" />
        <ElTableColumn label="序" type="index" width="56" />
        <ElTableColumn label="归口编号" min-width="180" prop="equipmentCode" />
        <ElTableColumn label="设备名称" min-width="180" prop="equipmentName" />
        <ElTableColumn
          label="存放地点"
          min-width="180"
          prop="locationDescription"
        />
        <ElTableColumn label="操作" width="100">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click="emit('applyCommonDevice', row)"
            >
              选择
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </section>

    <template #footer>
      <ElButton @click="dialogVisible = false">退出</ElButton>
      <ElButton
        :loading="props.submitting"
        type="primary"
        @click="emit('submit')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
