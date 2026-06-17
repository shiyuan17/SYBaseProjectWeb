<script setup lang="ts">
import type {
  MedicalWasteSpecimenLabelView,
  MedicalWasteSpecimenOptionsView,
  MedicalWasteSpecimenPreviewRequest,
} from '../types/operation-support';

import { computed } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { formatNullable } from '../utils/format';

type SpecimenPrintForm = MedicalWasteSpecimenPreviewRequest & {
  printInfo?: string;
  weightKg?: string;
};

const props = defineProps<{
  form: SpecimenPrintForm;
  labels: MedicalWasteSpecimenLabelView[];
  loading?: boolean;
  modelValue: boolean;
  options: MedicalWasteSpecimenOptionsView;
  previewing?: boolean;
  querying?: boolean;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  changeDate: [offset: number];
  query: [];
  submit: [];
  'update:form': [value: SpecimenPrintForm];
  'update:modelValue': [value: boolean];
}>();

const specimenCount = computed(() => props.labels.length);

function resolvePatientIdDisplay(row: MedicalWasteSpecimenLabelView) {
  return row.patientIdDisplay || row.patientId || null;
}

function updateForm(patch: Partial<SpecimenPrintForm>) {
  emit('update:form', {
    ...props.form,
    ...patch,
  });
}

const bagNameModel = computed({
  get: () => props.form.bagName,
  set: (value: string) => updateForm({ bagName: value }),
});

const grossingOperatorNameModel = computed({
  get: () => props.form.grossingOperatorName,
  set: (value: string) => updateForm({ grossingOperatorName: value }),
});

const grossingStationNameModel = computed({
  get: () => props.form.grossingStationName,
  set: (value: string) => updateForm({ grossingStationName: value }),
});

const grossingPeriodModel = computed({
  get: () => props.form.grossingPeriod,
  set: (value: string) => updateForm({ grossingPeriod: value }),
});

const grossingDateModel = computed({
  get: () => props.form.grossingDate,
  set: (value: string) => updateForm({ grossingDate: value }),
});

const printInfoModel = computed({
  get: () => props.form.printInfo ?? '',
  set: (value: string) => updateForm({ printInfo: value }),
});

const weightKgModel = computed({
  get: () => props.form.weightKg ?? '',
  set: (value: string) => updateForm({ weightKg: value }),
});
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    destroy-on-close
    title="打印标签"
    width="980px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm class="grid grid-cols-2 gap-x-4" label-width="100px">
      <ElFormItem label="回收袋名称" required>
        <ElInput v-model="bagNameModel" placeholder="请输入回收袋名称" />
      </ElFormItem>
      <ElFormItem label="取材人姓名" required>
        <ElSelect
          v-model="grossingOperatorNameModel"
          clearable
          filterable
          placeholder="请选择取材人"
        >
          <ElOption
            v-for="item in options.grossingOperators"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="取材台" required>
        <ElSelect
          v-model="grossingStationNameModel"
          clearable
          filterable
          placeholder="请选择取材台"
        >
          <ElOption
            v-for="item in options.grossingStations"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="取材时间段" required>
        <ElSelect v-model="grossingPeriodModel" placeholder="请选择时间段">
          <ElOption
            v-for="item in options.grossingPeriods"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="业务日期" required>
        <div class="flex w-full items-center gap-2">
          <ElButton @click="emit('changeDate', -1)">前一天</ElButton>
          <ElDatePicker
            v-model="grossingDateModel"
            class="flex-1"
            placeholder="选择日期"
            type="date"
            value-format="YYYY-MM-DD"
          />
          <ElButton @click="emit('changeDate', 1)">后一天</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem label="打印信息">
        <ElInput v-model="printInfoModel" readonly />
      </ElFormItem>
      <ElFormItem label="重量(KG)">
        <ElInput v-model="weightKgModel" placeholder="可选" />
      </ElFormItem>
      <ElFormItem label="标本数量">
        <ElInput :model-value="String(specimenCount)" readonly />
      </ElFormItem>
    </ElForm>

    <ElTable
      v-loading="previewing || loading"
      :data="labels"
      border
      class="mt-3"
      height="320"
    >
      <ElTableColumn label="病人ID" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(resolvePatientIdDisplay(row)) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人姓名" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病理号" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本名称" min-width="220">
        <template #default="{ row }">
          {{ formatNullable(row.specimenName) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton :loading="querying" @click="emit('query')">查询</ElButton>
        <ElButton :loading="submitting" type="primary" @click="emit('submit')">
          打印标签
        </ElButton>
        <ElButton @click="emit('update:modelValue', false)">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
