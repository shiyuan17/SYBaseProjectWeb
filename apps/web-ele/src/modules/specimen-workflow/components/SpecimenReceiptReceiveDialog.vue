<script setup lang="ts">
import type {
  ReceiptConfirmForm,
  ReceiptConfirmSummary,
} from '../utils/specimen-receipt';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

defineProps<{
  submitting: boolean;
  summary: ReceiptConfirmSummary;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'receiveUserChange', user: null | { id: string; name: string }): void;
  (event: 'submit'): void;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const form = defineModel<ReceiptConfirmForm>('form', {
  required: true,
});
</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    destroy-on-close
    title="标本签收"
    width="720px"
    @closed="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <section
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <div class="mb-3 text-base font-semibold text-foreground">提示信息</div>
        <div class="text-lg font-semibold text-danger">
          当批扫码共涉及 {{ summary.applicationCount }} 个申请单，{{
            summary.patientCount
          }}
          个病人，{{ summary.specimenCount }} 个标本。
        </div>
      </section>

      <section
        class="rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <ElForm label-width="96px">
          <div class="grid gap-4">
            <ElFormItem label="物流人员" required>
              <ElInput
                v-model="form.logisticsStaffName"
                maxlength="100"
                placeholder="请输入物流人员名称"
              />
            </ElFormItem>
            <ElFormItem label="签收人员" required>
              <SystemUserSelect
                v-model="form.receivedByUserId"
                :selected-label="form.receivedByName"
                placeholder="请选择签收人员"
                @change="emit('receiveUserChange', $event)"
              />
            </ElFormItem>
          </div>
        </ElForm>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="emit('close')">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="emit('submit')">
          确认
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
