<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';

import { computed } from 'vue';

import { ElAlert, ElButton, ElDrawer, ElEmpty } from 'element-plus';

import ApplicationRegistrationPatientPanel from '#/modules/specimen-workflow/components/ApplicationRegistrationPatientPanel.vue';

import { formatPendingPathologyNo } from '../../utils/format';

const props = defineProps<{
  error?: string;
  loading?: boolean;
  modelValue: boolean;
  pathologyNo?: null | string;
  record: ApplicationRegistrationWorkbenchRecord | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  save: [];
  'update:modelValue': [value: boolean];
  'update:record': [value: ApplicationRegistrationWorkbenchRecord];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});
</script>

<template>
  <ElDrawer
    v-model="visible"
    append-to-body
    direction="btt"
    :show-close="false"
    size="82%"
  >
    <template #header>
      <div class="flex w-full items-start justify-between gap-4">
        <div>
          <div class="text-lg font-semibold text-slate-900">编辑申请</div>
          <p class="mt-1 text-sm text-slate-500">
            当前病例
            {{
              formatPendingPathologyNo(pathologyNo)
            }}，在这里补充患者、传染、手术与妇科信息。
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <ElButton @click="visible = false">关闭</ElButton>
          <ElButton
            :disabled="record === null"
            :loading="saving"
            type="primary"
            @click="emit('save')"
          >
            保存申请信息
          </ElButton>
        </div>
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col bg-slate-50">
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <ElAlert
          v-if="error"
          class="mb-4"
          :closable="false"
          :title="error"
          type="error"
        />

        <div
          v-if="loading"
          class="flex flex-1 items-center justify-center rounded-lg bg-white text-sm text-slate-500 shadow-sm"
        >
          正在加载申请编辑信息...
        </div>

        <ApplicationRegistrationPatientPanel
          v-else-if="record"
          :building-label="record.surgeryInfo.buildingId || ''"
          compact
          edit-mode="direct"
          full-height
          :record="record"
          :room-label="record.surgeryInfo.roomId || ''"
          :save-disabled="saving"
          :saving="saving"
          :show-reprint-action="false"
          :show-save-action="false"
          title="申请信息"
          @save-patient-info="emit('save')"
          @update:record="emit('update:record', $event)"
        />

        <div
          v-else
          class="flex flex-1 items-center justify-center rounded-lg bg-white shadow-sm"
        >
          <ElEmpty description="暂无可编辑的申请信息" />
        </div>
      </div>
    </div>
  </ElDrawer>
</template>
