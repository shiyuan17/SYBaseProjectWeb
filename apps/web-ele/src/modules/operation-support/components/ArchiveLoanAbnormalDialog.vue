<script setup lang="ts">
import type { MaterialLoanAbnormalFormState } from '../utils/archive-forms';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
} from 'element-plus';

import { formatMaterialType, formatNullable } from '../utils/format';

defineProps<{
  materialSummary: string;
  selectedCount: number;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const abnormalForm = defineModel<MaterialLoanAbnormalFormState>(
  'abnormalForm',
  {
    required: true,
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="`${abnormalForm.materialType === 'SLIDE' ? '玻片异常登记' : '蜡块异常登记'}${
      selectedCount > 1 ? `（${selectedCount} 条）` : ''
    }`"
    width="760px"
  >
    <ElForm label-width="124px">
      <ElFormItem label="材料类型">
        <span>{{ formatMaterialType(abnormalForm.materialType) }}</span>
      </ElFormItem>
      <ElFormItem label="材料">
        <span>
          {{ formatNullable(materialSummary || abnormalForm.materialId) }}
        </span>
      </ElFormItem>

      <template v-if="abnormalForm.materialType === 'SLIDE'">
        <ElFormItem label="借阅玻片号">
          <ElInput v-model="abnormalForm.borrowedSlideNo" />
        </ElFormItem>
        <ElFormItem label="病人姓名">
          <ElInput v-model="abnormalForm.borrowerName" />
        </ElFormItem>
        <ElFormItem label="借片人与患者关系">
          <ElInput v-model="abnormalForm.borrowerRelationship" />
        </ElFormItem>
        <ElFormItem label="借片人电话">
          <ElInput v-model="abnormalForm.borrowerPhone" />
        </ElFormItem>
        <ElFormItem label="借片人单位">
          <ElInput v-model="abnormalForm.borrowerUnit" />
        </ElFormItem>
        <ElFormItem label="借片人身份证">
          <ElInput v-model="abnormalForm.borrowerIdentityNo" />
        </ElFormItem>
        <ElFormItem label="借片日期">
          <ElDatePicker
            v-model="abnormalForm.borrowedAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem label="还片日期">
          <ElDatePicker
            v-model="abnormalForm.expectedReturnAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem label="玻片总数">
          <ElInputNumber v-model="abnormalForm.slideCount" :min="0" />
        </ElFormItem>
        <ElFormItem label="押金">
          <ElInput v-model="abnormalForm.depositAmount" />
        </ElFormItem>
        <ElFormItem label="借记玻片内容">
          <ElInput
            v-model="abnormalForm.borrowedContent"
            :rows="3"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="还片异常信息">
          <ElInput
            v-model="abnormalForm.returnAbnormalInfo"
            :rows="3"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="是否电话联系">
          <ElRadioGroup v-model="abnormalForm.contacted">
            <ElRadio :value="false">未联系</ElRadio>
            <ElRadio :value="true">已联系</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="联系结果">
          <ElInput
            v-model="abnormalForm.contactResult"
            :rows="3"
            type="textarea"
          />
        </ElFormItem>
      </template>

      <ElFormItem label="异常原因" required>
        <ElInput
          v-model="abnormalForm.abnormalReason"
          :rows="4"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">退出</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
