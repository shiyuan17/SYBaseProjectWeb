<script setup lang="ts">
import type { RoutineMedicalOrderRow } from '../composables/useRoutineMedicalOrderActions';

import { computed, reactive, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  rows: RoutineMedicalOrderRow[];
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      terminationReasonCode: string;
      terminationReasonLabel: string;
      terminationRemarks: string;
    },
  ];
  'update:modelValue': [value: boolean];
}>();

const TERMINATION_OPTIONS = [
  {
    label: '找不到对应蜡块',
    value: 'BLOCK_NOT_FOUND',
  },
  {
    label: '蜡块已损坏无法使用',
    value: 'BLOCK_DAMAGED',
  },
  {
    label: '其他',
    value: 'OTHER',
  },
] as const;

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  terminationReasonCode: 'BLOCK_NOT_FOUND',
  terminationRemarks: '',
});

const selectedReasonLabel = computed(
  () =>
    TERMINATION_OPTIONS.find(
      (option) => option.value === form.terminationReasonCode,
    )?.label ?? '找不到对应蜡块',
);

function resetForm() {
  form.terminationReasonCode = 'BLOCK_NOT_FOUND';
  form.terminationRemarks = '';
}

function submitTermination() {
  const remarks = form.terminationRemarks.trim();
  if (form.terminationReasonCode === 'OTHER' && !remarks) {
    ElMessage.warning('选择“其他”时请填写备注');
    return;
  }

  emit('submit', {
    terminationReasonCode: form.terminationReasonCode,
    terminationReasonLabel: selectedReasonLabel.value,
    terminationRemarks: remarks,
  });
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="请填写终止原因"
    width="760px"
  >
    <div class="flex flex-col gap-4">
      <ElForm label-width="92px">
        <ElFormItem label="终止原因">
          <ElSelect
            v-model="form.terminationReasonCode"
            placeholder="请选择终止原因"
          >
            <ElOption
              v-for="option in TERMINATION_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="form.terminationRemarks"
            :placeholder="
              form.terminationReasonCode === 'OTHER'
                ? '请选择“其他”时必须填写备注'
                : '必要时补充终止说明'
            "
            :rows="4"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>

      <ElTable :data="rows" border size="small">
        <ElTableColumn label="序" width="60">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="病理号" min-width="160">
          <template #default="{ row }">
            {{ row.pathologyNo ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="蜡块号" min-width="100">
          <template #default="{ row }">
            {{ row.blockNo ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="检查项目" min-width="140">
          <template #default="{ row }">
            {{ row.checkItem ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="是否终止" min-width="96">
          <template #default="{ row }">
            {{ row.releaseStatus ?? '确认' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="病人" min-width="120">
          <template #default="{ row }">
            {{ row.patientName ?? '-' }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
      <ElButton type="primary" @click="submitTermination">保存</ElButton>
    </template>
  </ElDialog>
</template>
