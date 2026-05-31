<script setup lang="ts">
import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
} from '../utils/specimen-receipt';

import { ElButton, ElDrawer, ElForm, ElFormItem, ElInput } from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import SpecimenReceiptDraftTable from './SpecimenReceiptDraftTable.vue';

defineProps<{
  items: ReceiptDraftItem[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'addRow'): void;
  (event: 'close'): void;
  (
    event: 'directReceiveUserChange',
    user: null | { id: string; name: string },
  ): void;
  (event: 'removeRow', key: number): void;
  (event: 'submit'): void;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const form = defineModel<ReceiptOperatorForm>('form', {
  required: true,
});
</script>

<template>
  <ElDrawer v-model="visible" title="条码直收" size="52%">
    <ElForm label-width="96px">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ElFormItem label="接收人" required>
          <SystemUserSelect
            v-model="form.receivedByUserId"
            :selected-label="form.receivedByName"
            placeholder="请选择接收人"
            @change="emit('directReceiveUserChange', $event)"
          />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="form.terminalCode" placeholder="工作站终端编码" />
        </ElFormItem>
      </div>
    </ElForm>

    <div class="mb-3 flex justify-end">
      <ElButton type="primary" @click="emit('addRow')">新增条码</ElButton>
    </div>

    <SpecimenReceiptDraftTable
      :items="items"
      show-remove-action
      @remove="emit('removeRow', $event)"
    />

    <div class="mt-4 flex justify-end gap-2">
      <ElButton @click="emit('close')">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        提交直收
      </ElButton>
    </div>
  </ElDrawer>
</template>
