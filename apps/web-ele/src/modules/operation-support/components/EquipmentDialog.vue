<script setup lang="ts">
import type { EquipmentFormState } from '../utils/equipment-ledger';

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
  ElTimePicker,
} from 'element-plus';

import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
} from '../constants';

const props = defineProps<{
  isEditingEquipment: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const equipmentForm = defineModel<EquipmentFormState>('equipmentForm', {
  required: true,
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="props.isEditingEquipment ? '编辑设备信息' : '新增设备信息'"
    top="3vh"
    width="1100px"
  >
    <ElForm label-width="112px">
      <div class="grid gap-x-8 gap-y-2 lg:grid-cols-2">
        <div>
          <ElFormItem label="资产编号" required>
            <ElInput
              v-model="equipmentForm.equipmentCode"
              :disabled="props.isEditingEquipment"
            />
          </ElFormItem>
          <ElFormItem label="设备名称" required>
            <ElInput v-model="equipmentForm.equipmentName" />
          </ElFormItem>
          <ElFormItem label="数量">
            <ElInputNumber
              v-model="equipmentForm.quantity"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="购置人姓名">
            <ElInput v-model="equipmentForm.purchaserName" />
          </ElFormItem>
          <ElFormItem label="归口单位">
            <ElInput v-model="equipmentForm.managementUnit" />
          </ElFormItem>
          <ElFormItem label="使用单位">
            <ElInput v-model="equipmentForm.useUnit" />
          </ElFormItem>
          <ElFormItem label="负责人编号">
            <ElInput v-model="equipmentForm.principalCode" />
          </ElFormItem>
          <ElFormItem label="使用人姓名">
            <ElInput v-model="equipmentForm.userName" />
          </ElFormItem>
          <ElFormItem label="启用日期">
            <ElDatePicker
              v-model="equipmentForm.enabledAt"
              format="YYYY/M/D"
              placeholder="选择启用日期"
              style="width: 100%"
              value-format="YYYY-MM-DDT00:00:00"
            />
          </ElFormItem>
          <ElFormItem label="出厂编号">
            <ElInput v-model="equipmentForm.factoryNo" />
          </ElFormItem>
          <ElFormItem label="使用年限">
            <ElInputNumber
              v-model="equipmentForm.serviceLifeYears"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="厂家">
            <ElInput v-model="equipmentForm.manufacturer" />
          </ElFormItem>
          <ElFormItem label="端口号">
            <ElInput v-model="equipmentForm.portNo" />
          </ElFormItem>
          <ElFormItem label="常用开机时间">
            <ElTimePicker
              v-model="equipmentForm.commonStartupTime"
              format="HH:mm:ss"
              placeholder="选择开机时间"
              style="width: 100%"
              value-format="HH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="常用使用内容">
            <ElInput v-model="equipmentForm.commonUsageContent" />
          </ElFormItem>
          <ElFormItem label="设置温度(℃)">
            <ElInputNumber
              v-model="equipmentForm.setTemperature"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="存放地址">
            <ElInput v-model="equipmentForm.locationDescription" />
          </ElFormItem>
          <ElFormItem label="RFID">
            <ElInput v-model="equipmentForm.rfid" />
          </ElFormItem>
        </div>

        <div>
          <ElFormItem label="状态" required>
            <ElSelect v-model="equipmentForm.equipmentStatus">
              <ElOption
                v-for="option in EQUIPMENT_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="仪器类型" required>
            <ElSelect
              v-model="equipmentForm.equipmentCategory"
              allow-create
              clearable
              default-first-option
              filterable
            >
              <ElOption
                v-for="option in EQUIPMENT_CATEGORY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="购置日期">
            <ElDatePicker
              v-model="equipmentForm.purchaseDate"
              format="YYYY/M/D"
              placeholder="选择购置日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem label="购置人编号">
            <ElInput v-model="equipmentForm.purchaserCode" />
          </ElFormItem>
          <ElFormItem label="归口编号">
            <ElInput v-model="equipmentForm.managementCode" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="equipmentForm.remarks" />
          </ElFormItem>
          <ElFormItem label="负责人姓名">
            <ElInput v-model="equipmentForm.principalName" />
          </ElFormItem>
          <ElFormItem label="生产日期">
            <ElDatePicker
              v-model="equipmentForm.productionDate"
              format="YYYY/M/D"
              placeholder="选择生产日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem label="保修结束日期">
            <ElDatePicker
              v-model="equipmentForm.warrantyEndDate"
              format="YYYY/M/D"
              placeholder="选择保修结束日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem label="折旧方法">
            <ElInput v-model="equipmentForm.depreciationMethod" />
          </ElFormItem>
          <ElFormItem label="价格">
            <ElInputNumber
              v-model="equipmentForm.price"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
          <ElFormItem label="型号">
            <ElInput v-model="equipmentForm.modelNo" />
          </ElFormItem>
          <ElFormItem label="IP地址">
            <ElInput v-model="equipmentForm.ipAddress" />
          </ElFormItem>
          <ElFormItem label="常用关机时间">
            <ElTimePicker
              v-model="equipmentForm.commonShutdownTime"
              format="HH:mm:ss"
              placeholder="选择关机时间"
              style="width: 100%"
              value-format="HH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="是否常用">
            <ElRadioGroup v-model="equipmentForm.commonlyUsed">
              <ElRadio :value="true">是</ElRadio>
              <ElRadio :value="false">否</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="当前温度(℃)">
            <ElInputNumber
              v-model="equipmentForm.currentTemperature"
              controls-position="right"
              style="width: 100%"
            />
          </ElFormItem>
        </div>
      </div>
    </ElForm>
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
