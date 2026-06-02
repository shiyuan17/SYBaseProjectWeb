<script setup lang="ts">
import type {
  ReceiptDraftItem,
  ReceiptOperatorForm,
} from '../utils/specimen-receipt';

import { computed } from 'vue';

import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import { countDerivedAbnormalReceiptItems } from '../utils/specimen-receipt';
import SpecimenReceiptDraftTable from './SpecimenReceiptDraftTable.vue';

const props = defineProps<{
  items: ReceiptDraftItem[];
  submitting: boolean;
}>();

const emit = defineEmits<{
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

const draftItemCount = computed(() => props.items.length);
const derivedAbnormalCount = computed(() =>
  countDerivedAbnormalReceiptItems(props.items),
);
</script>

<template>
  <ElDrawer
    v-model="visible"
    :append-to-body="true"
    :destroy-on-close="true"
    direction="btt"
    size="56%"
    title="异常接收"
  >
    <div class="flex h-full flex-col gap-4">
      <section
        class="grid gap-4 rounded-lg border border-border bg-card px-4 py-4 shadow-sm lg:grid-cols-[minmax(280px,420px)_1fr]"
      >
        <ElForm label-width="88px">
          <ElFormItem class="mb-0" label="接收人" required>
            <SystemUserSelect
              v-model="form.receivedByUserId"
              :selected-label="form.receivedByName"
              placeholder="请选择接收人"
              @change="emit('directReceiveUserChange', $event)"
            />
          </ElFormItem>
        </ElForm>

        <div
          class="flex flex-wrap items-center justify-start gap-3 border-border lg:justify-end lg:border-l lg:pl-4"
        >
          <ElTag effect="plain" type="info">待提交 {{ draftItemCount }} 条</ElTag>
          <ElTag :type="derivedAbnormalCount > 0 ? 'danger' : 'success'" effect="light">
            {{ derivedAbnormalCount > 0 ? `自动异常 ${derivedAbnormalCount} 条` : '当前均为正常接收' }}
          </ElTag>
          <span class="text-sm text-muted-foreground">
            拒收、退回或质控不合格提交后会自动标记异常
          </span>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-foreground">接收明细</div>
            <div class="text-sm text-muted-foreground">
              可直接调整接收结果、质控结果和异常原因后提交
            </div>
          </div>
          <div class="text-sm text-muted-foreground">
            共 {{ draftItemCount }} 条
          </div>
        </div>

        <SpecimenReceiptDraftTable
          :items="items"
          max-height="420"
          show-remove-action
          @remove="emit('removeRow', $event)"
        />
      </section>

      <div class="flex justify-end gap-2 border-t border-border pt-2">
        <ElButton @click="emit('close')">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="emit('submit')">
          提交异常接收
        </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>
