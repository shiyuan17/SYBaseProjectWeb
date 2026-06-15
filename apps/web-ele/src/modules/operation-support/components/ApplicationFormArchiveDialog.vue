<script setup lang="ts">
import type { ArchiveRecordView } from '../types/operation-support';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { formatArchiveStorageStatus, formatNullable } from '../utils/format';

defineProps<{
  archivePermissionWarning: string;
  getArchiveStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  selectedPositionLabel: string;
  selectedRecords: ArchiveRecordView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitArchive'): void;
}>();

const visible = defineModel<boolean>({ required: true });
const remarks = defineModel<string>('remarks', { required: true });
</script>

<template>
  <ElDialog
    v-model="visible"
    append-to-body
    destroy-on-close
    title="申请单归档"
    width="960px"
  >
    <ElAlert
      v-if="archivePermissionWarning"
      :closable="false"
      class="mb-4"
      :title="archivePermissionWarning"
      type="warning"
    />

    <div class="flex flex-col gap-4">
      <ElForm
        class="grid grid-cols-1 gap-x-4 md:grid-cols-2"
        label-width="96px"
      >
        <ElFormItem label="归档柜编号" required>
          <ElInput :model-value="selectedPositionLabel" readonly />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="remarks" placeholder="请输入备注" />
        </ElFormItem>
      </ElForm>

      <div class="rounded-lg border border-border">
        <div
          class="border-b border-border px-4 py-3 text-sm font-medium text-[var(--el-text-color-primary)]"
        >
          已选择申请单记录
        </div>
        <ElTable
          border
          class="w-full"
          :data="selectedRecords"
          max-height="360"
          row-key="objectId"
        >
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="病人姓名" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.patientName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="归档状态" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
                {{ formatArchiveStorageStatus(row.archiveStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请医生" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.applicantDoctorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请时间" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.applicationDate) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">退出</ElButton>
      <ElButton
        :loading="submitting"
        type="primary"
        @click="emit('submitArchive')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
