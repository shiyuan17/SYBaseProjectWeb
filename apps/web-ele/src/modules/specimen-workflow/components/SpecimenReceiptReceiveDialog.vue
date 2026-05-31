<script setup lang="ts">
import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
  TransportReceiptGroup,
} from '../utils/specimen-receipt';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { formatNullable } from '../utils/format';
import SpecimenReceiptDraftTable from './SpecimenReceiptDraftTable.vue';

defineProps<{
  items: ReceiptDraftItem[];
  selectedGroup: null | TransportReceiptGroup;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'receiveUserChange', user: null | { id: string; name: string }): void;
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
  <ElDialog
    v-model="visible"
    destroy-on-close
    title="接收标本"
    width="78%"
    @closed="emit('close')"
  >
    <template v-if="selectedGroup">
      <ElDescriptions :column="2" border class="mb-4">
        <ElDescriptionsItem label="转运单号">
          {{ selectedGroup.transportOrderId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请单号">
          {{ selectedGroup.applicationNo }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="患者姓名">
          {{ formatNullable(selectedGroup.patientName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="待接收标本数">
          {{ selectedGroup.items.length }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="未接收数量">
          {{ selectedGroup.unreceivedCount }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="批次提醒">
          {{ selectedGroup.reminderCount }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElAlert
        v-if="selectedGroup.batchAbnormalFlag"
        class="mb-4"
        :closable="false"
        title="当前批次含异常标记，请重点核对容器数量、质控问题和拒收/退回原因。"
        type="warning"
        show-icon
      />

      <ElForm label-width="96px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="接收人" required>
            <SystemUserSelect
              v-model="form.receivedByUserId"
              :selected-label="form.receivedByName"
              placeholder="请选择接收人"
              @change="emit('receiveUserChange', $event)"
            />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="form.terminalCode" placeholder="工作站终端编码" />
          </ElFormItem>
        </div>
      </ElForm>

      <SpecimenReceiptDraftTable
        :items="items"
        :max-height="420"
        show-container-name
      />
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="emit('close')">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="emit('submit')">
          提交接收
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
