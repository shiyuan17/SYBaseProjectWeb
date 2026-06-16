<script setup lang="ts">
import { toRef } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { useTransportOrderCreateDialog } from '../composables/useTransportOrderCreateDialog';

const props = withDefaults(
  defineProps<{
    initialApplicationId?: string;
    initialApplicationNo?: string;
    modelValue: boolean;
  }>(),
  {
    initialApplicationId: '',
    initialApplicationNo: '',
  },
);

const emit = defineEmits<{
  created: [];
  'update:modelValue': [value: boolean];
}>();

const {
  createForm,
  createLoading,
  dialogVisible,
  eligibleSpecimens,
  formatSpecimenOptionLabel,
  handleDialogClosed,
  handleHandoverDepartmentChange,
  handleHandoverUserChange,
  handleReceiverDepartmentChange,
  loadApplicationContext,
  pageError,
  resolveSpecimenClinicalSymptom,
  resolveSpecimenCollectionMode,
  resolveSpecimenName,
  resolveSpecimenSite,
  resolveSpecimenType,
  submitCreate,
  visibleApplicationNo,
} = useTransportOrderCreateDialog({
  initialApplicationId: toRef(props, 'initialApplicationId'),
  initialApplicationNo: toRef(props, 'initialApplicationNo'),
  modelValue: toRef(props, 'modelValue'),
  onCreated: () => emit('created'),
  updateModelValue: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="创建转运单"
    width="1120px"
    @closed="handleDialogClosed"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <div class="text-sm text-muted-foreground">
        仅允许已完成核对、已固定完成、已确认且已入库的标本创建转运单。
      </div>

      <ElForm label-width="132px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="申请单编号" required>
            <ElInput
              v-model="createForm.applicationId"
              placeholder="请输入申请单编号"
              @blur="loadApplicationContext(true)"
              @keyup.enter="loadApplicationContext(true)"
            />
          </ElFormItem>
          <ElFormItem v-if="visibleApplicationNo" label="申请单号">
            <ElInput :model-value="visibleApplicationNo" readonly />
          </ElFormItem>
          <ElFormItem label="交接科室" required>
            <DepartmentSelect
              v-model="createForm.handoverDepartmentId"
              :selected-label="createForm.handoverDepartmentName"
              placeholder="请选择交接科室"
              @change="handleHandoverDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="交接人" required>
            <SystemUserSelect
              v-model="createForm.handoverUserId"
              :selected-label="createForm.handoverUserName"
              placeholder="请选择交接人"
              @change="handleHandoverUserChange"
            />
          </ElFormItem>
          <ElFormItem label="接收科室" required>
            <DepartmentSelect
              v-model="createForm.receiverDepartmentId"
              :selected-label="createForm.receiverDepartmentName"
              placeholder="请选择接收科室"
              @change="handleReceiverDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput
              v-model="createForm.terminalCode"
              placeholder="工作站终端编码"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="标本选择" required>
          <ElSelect
            v-model="createForm.selectedSpecimenIds"
            collapse-tags
            collapse-tags-tooltip
            filterable
            multiple
            placeholder="请选择当前申请单下已核对、已固定、已确认且已入库的标本"
            style="width: 100%"
          >
            <ElOption
              v-for="specimen in eligibleSpecimens"
              :key="specimen.id"
              :label="formatSpecimenOptionLabel(specimen)"
              :value="specimen.id"
            >
              <div class="flex flex-col gap-1 py-1">
                <span
                  class="font-medium text-[14px] text-[var(--el-text-color-primary)]"
                >
                  {{ resolveSpecimenName(specimen) }}
                </span>
                <span
                  class="text-[12px] leading-5 text-[var(--el-text-color-secondary)]"
                >
                  {{ `类型:${resolveSpecimenType(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `部位:${resolveSpecimenSite(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `采集方式:${resolveSpecimenCollectionMode(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `临床症状:${resolveSpecimenClinicalSymptom(specimen)}` }}
                </span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="建单前置条件">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            仅允许已完成核对、标本固定、标本确认和标本入库的标本创建转运单。
          </div>
        </ElFormItem>
        <ElFormItem label="批量扫码 / 粘贴">
          <ElInput
            v-model="createForm.specimenBarcodesText"
            :rows="4"
            placeholder="支持换行、空格、逗号分隔多个条码"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="createForm.remarks"
            :rows="2"
            placeholder="补充转运说明"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="createLoading" type="primary" @click="submitCreate">
        创建转运单
      </ElButton>
    </template>
  </ElDialog>
</template>
