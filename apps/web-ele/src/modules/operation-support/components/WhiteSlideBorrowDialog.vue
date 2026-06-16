<script setup lang="ts">
import type { WhiteSlideStockView } from '../types/operation-support';
import type { WhiteSlideBorrowFormState } from '../utils/white-slide-borrow';

import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

defineProps<{
  calculatedAmount: null | number;
  stocks: WhiteSlideStockView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'print'): void;
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const form = defineModel<WhiteSlideBorrowFormState>('form', {
  required: true,
});

function showPlaceholderMessage() {
  ElMessage.info('读卡/配置功能本轮仅保留占位，暂未接入本地设备。');
}
</script>

<template>
  <ElDialog v-model="dialogVisible" title="借白片" width="760px">
    <ElForm label-width="128px">
      <ElFormItem label="白片库存">
        <ElSelect v-model="form.stockId" style="width: 100%">
          <ElOption
            v-for="stock in stocks"
            :key="stock.id"
            :label="`${stock.stockNo} / 可借 ${stock.quantityAvailable}`"
            :value="stock.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="患者姓名" required>
        <ElInput v-model="form.patientName" />
      </ElFormItem>
      <ElFormItem label="检查号">
        <ElInput v-model="form.pathologyNo" />
      </ElFormItem>
      <ElFormItem label="蜡块号">
        <ElInput v-model="form.embeddingBoxNo" />
      </ElFormItem>
      <ElFormItem label="切白片数量" required>
        <ElInputNumber v-model="form.quantity" :min="1" style="width: 180px" />
      </ElFormItem>
      <ElFormItem label="切白片原因(用途)" required>
        <ElInput v-model="form.slicePurpose" />
      </ElFormItem>
      <ElFormItem label="切白片厚度" required>
        <ElInput v-model="form.sliceThickness" />
      </ElFormItem>
      <ElFormItem label="借白片人姓名" required>
        <ElInput v-model="form.borrowerName" />
      </ElFormItem>
      <ElFormItem label="借白片人身份证">
        <div class="flex w-full gap-2">
          <ElInput v-model="form.borrowerIdentityNo" />
          <ElButton disabled @click="showPlaceholderMessage">读卡</ElButton>
          <ElButton disabled @click="showPlaceholderMessage">配置</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem label="借白片人单位">
        <ElInput v-model="form.borrowerUnit" />
      </ElFormItem>
      <ElFormItem label="借白片人电话">
        <ElInput v-model="form.borrowerPhone" />
      </ElFormItem>
      <ElFormItem label="蜡块使用情况">
        <ElInput v-model="form.waxBlockUsage" />
      </ElFormItem>
      <ElFormItem label="单价">
        <ElInputNumber
          v-model="form.unitPrice"
          :min="0"
          :precision="2"
          style="width: 180px"
        />
      </ElFormItem>
      <ElFormItem label="金额">
        <ElInput :model-value="String(calculatedAmount ?? '')" readonly />
      </ElFormItem>
      <ElFormItem label="保存直接打印借阅单">
        <ElCheckbox v-model="form.saveDirectPrint" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remarks" :rows="3" type="textarea" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton @click="emit('print')">打印借阅单</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
