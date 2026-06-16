<script setup lang="ts">
import type { ReagentView } from '../types/operation-support';
import type {
  ReagentFormState,
  ReagentMedicalOrderOption,
} from '../utils/reagent-ledger';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  REAGENT_DILUTION_OPTIONS,
  REAGENT_TEMPLATE_STATUS_OPTIONS,
  REAGENT_TYPE_OPTIONS,
  REAGENT_UNIT_OPTIONS,
  REAGENT_USAGE_OPTIONS,
} from '../constants';

const props = defineProps<{
  isEditingReagent: boolean;
  medicalOrderOptions: ReagentMedicalOrderOption[];
  medicalOrdersLoading: boolean;
  reagentAuditInfo: null | ReagentView;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const reagentForm = defineModel<ReagentFormState>('reagentForm', {
  required: true,
});

function handleOrderItemChange(orderDictItemId: string) {
  const selectedOption = props.medicalOrderOptions.find(
    (item) => item.id === orderDictItemId,
  );
  if (!selectedOption) {
    return;
  }
  if (!reagentForm.value.reagentName.trim()) {
    reagentForm.value.reagentName = selectedOption.orderItemName;
  }
}

function shiftValidityDays(yearDelta: number) {
  const currentValue = reagentForm.value.validityDays ?? 0;
  reagentForm.value.validityDays = Math.max(0, currentValue + yearDelta * 365);
}

function formatAuditValue(value?: null | string) {
  return value?.trim() || '-';
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    append-to-body
    class="reagent-dialog"
    title="新增试剂模板"
    width="880px"
  >
    <div class="reagent-dialog__toolbar">
      <ElButton
        :loading="props.submitting"
        type="primary"
        @click="emit('submit')"
      >
        保存
      </ElButton>
      <ElButton @click="dialogVisible = false">退出</ElButton>
    </div>

    <ElForm class="reagent-dialog__form" label-width="96px">
      <div class="reagent-dialog__grid">
        <ElFormItem class="reagent-dialog__name" label="试剂名称" required>
          <ElInput v-model="reagentForm.reagentName" />
        </ElFormItem>
        <div class="reagent-dialog__required-tip">
          带 <span>*</span> 为必填项
        </div>

        <ElFormItem label="试剂类型" required>
          <ElSelect
            v-model="reagentForm.reagentType"
            clearable
            placeholder="请选择"
          >
            <ElOption
              v-for="option in REAGENT_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <div class="reagent-dialog__pair">
          <ElFormItem label="对应医嘱">
            <ElSelect
              v-model="reagentForm.orderDictItemId"
              clearable
              filterable
              :loading="props.medicalOrdersLoading"
              placeholder="输入字母可搜索"
              @change="handleOrderItemChange"
            >
              <ElOption
                v-for="option in props.medicalOrderOptions"
                :key="option.id"
                :label="option.label"
                :value="option.id"
              />
            </ElSelect>
          </ElFormItem>
          <div class="reagent-dialog__hint">输入字母可搜索</div>
        </div>

        <ElFormItem label="稀释比例">
          <ElSelect
            v-model="reagentForm.dilutionRatio"
            clearable
            placeholder="请选择"
          >
            <ElOption
              v-for="option in REAGENT_DILUTION_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <div class="reagent-dialog__pair">
          <ElFormItem label="试剂用途" required>
            <ElSelect
              v-model="reagentForm.reagentUsage"
              clearable
              placeholder="请选择"
            >
              <ElOption
                v-for="option in REAGENT_USAGE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>

        <ElFormItem label="试剂状态" required>
          <ElSelect v-model="reagentForm.status">
            <ElOption
              v-for="option in REAGENT_TEMPLATE_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <div class="reagent-dialog__pair reagent-dialog__pair--with-actions">
          <ElFormItem label="有效期天数">
            <ElInputNumber v-model="reagentForm.validityDays" :min="0" />
          </ElFormItem>
          <div class="reagent-dialog__inline-actions">
            <ElButton @click="shiftValidityDays(1)">+1年</ElButton>
            <ElButton @click="shiftValidityDays(-1)">-1年</ElButton>
          </div>
        </div>

        <ElFormItem label="克隆号">
          <ElInput v-model="reagentForm.cloneNo" />
        </ElFormItem>
        <div class="reagent-dialog__pair">
          <ElFormItem label="试剂单位">
            <ElSelect v-model="reagentForm.unit" clearable placeholder="请选择">
              <ElOption
                v-for="option in REAGENT_UNIT_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>

        <ElFormItem label="订购阈值">
          <ElInputNumber
            v-model="reagentForm.defaultLowStockThreshold"
            :min="0"
          />
        </ElFormItem>
        <div class="reagent-dialog__text-tip">
          当库存数量小于等于阈值时，提示用户
        </div>

        <ElFormItem label="临期阈值(天)">
          <ElInputNumber v-model="reagentForm.defaultNearExpiryDays" :min="0" />
        </ElFormItem>
        <div class="reagent-dialog__text-tip">
          单位：天，当前日期距离过期日期的天数小于等于阈值时，提醒用户
        </div>

        <ElFormItem label="可染数量">
          <ElInputNumber v-model="reagentForm.stainCapacity" :min="0" />
        </ElFormItem>
        <div class="reagent-dialog__text-tip">
          预计每瓶可染色的数量（同时用于计算每次消耗量）
        </div>

        <ElFormItem label="染色阈值">
          <ElInputNumber v-model="reagentForm.stainThreshold" :min="0" />
        </ElFormItem>
        <div class="reagent-dialog__text-tip">
          当每瓶可用染色总数减去实际染色数小于等于阈值时，提醒用户
        </div>

        <ElFormItem class="reagent-dialog__remarks" label="备注">
          <ElInput v-model="reagentForm.remarks" />
        </ElFormItem>
        <div></div>

        <ElFormItem label="新增人">
          <ElInput
            :model-value="
              formatAuditValue(props.reagentAuditInfo?.createdByName)
            "
            readonly
          />
        </ElFormItem>
        <ElFormItem label="新增时间">
          <ElInput
            :model-value="formatAuditValue(props.reagentAuditInfo?.createdAt)"
            readonly
          />
        </ElFormItem>

        <ElFormItem label="最后修改人">
          <ElInput
            :model-value="
              formatAuditValue(props.reagentAuditInfo?.updatedByName)
            "
            readonly
          />
        </ElFormItem>
        <ElFormItem label="最后修改时间">
          <ElInput
            :model-value="formatAuditValue(props.reagentAuditInfo?.updatedAt)"
            readonly
          />
        </ElFormItem>
      </div>
    </ElForm>
  </ElDialog>
</template>

<style scoped>
.reagent-dialog :deep(.el-dialog__header) {
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.reagent-dialog :deep(.el-dialog__title) {
  font-size: 14px;
}

.reagent-dialog :deep(.el-dialog__body) {
  padding: 0 16px 16px;
}

.reagent-dialog :deep(.el-form-item) {
  margin-bottom: 12px;
}

.reagent-dialog :deep(.el-input),
.reagent-dialog :deep(.el-input-number),
.reagent-dialog :deep(.el-select),
.reagent-dialog :deep(.el-select__wrapper) {
  width: 100%;
}

.reagent-dialog__toolbar {
  display: flex;
  gap: 12px;
  padding: 14px 0;
}

.reagent-dialog__form {
  padding-top: 12px;
}

.reagent-dialog__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.55fr);
  gap: 0 16px;
  align-items: start;
}

.reagent-dialog__name {
  margin-bottom: 14px;
}

.reagent-dialog__required-tip {
  display: flex;
  align-items: center;
  min-height: 32px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.reagent-dialog__required-tip span {
  color: var(--el-color-danger);
}

.reagent-dialog__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
}

.reagent-dialog__pair--with-actions {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.reagent-dialog__hint,
.reagent-dialog__text-tip {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.reagent-dialog__inline-actions {
  display: flex;
  gap: 10px;
  padding-top: 2px;
}

.reagent-dialog__remarks {
  grid-column: 1 / span 2;
}

@media (max-width: 900px) {
  .reagent-dialog__grid {
    grid-template-columns: 1fr;
  }

  .reagent-dialog__remarks {
    grid-column: auto;
  }
}
</style>
