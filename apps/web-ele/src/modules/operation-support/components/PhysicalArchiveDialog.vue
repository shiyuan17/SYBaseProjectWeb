<script setup lang="ts">
import type {
  ArchiveCabinetView,
  ArchiveObjectType,
  ArchiveRecordView,
} from '../types/operation-support';
import type { ArchiveFormState } from '../utils/archive-forms';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatArchiveObjectStatus,
  formatArchiveStorageStatus,
  formatNullable,
} from '../utils/format';

defineProps<{
  archivePermissionWarning: string;
  cabinets: ArchiveCabinetView[];
  getArchiveStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  objectType: ArchiveObjectType;
  selectedRecords: ArchiveRecordView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitArchive'): void;
}>();

const visible = defineModel<boolean>({ required: true });
const archiveForm = defineModel<ArchiveFormState>('archiveForm', {
  required: true,
});

const titleMap: Record<ArchiveObjectType, string> = {
  APPLICATION_FORM: '申请单归档',
  EMBEDDING_BOX: '蜡块归档',
  SLIDE: '玻片归档',
  SPECIMEN: '标本归档',
};
</script>

<template>
  <ElDialog
    v-model="visible"
    append-to-body
    destroy-on-close
    :title="titleMap[objectType]"
    width="760px"
  >
    <ElAlert
      v-if="archivePermissionWarning"
      :closable="false"
      class="mb-4"
      :title="archivePermissionWarning"
      type="warning"
    />

    <ElForm class="physical-archive-form" label-width="104px">
      <div class="grid grid-cols-2 gap-x-8">
        <ElFormItem label="归档框编号" required>
          <ElSelect
            v-model="archiveForm.archiveCabinetId"
            filterable
            placeholder="请选择归档框"
            style="width: 220px"
          >
            <ElOption
              v-for="cabinet in cabinets"
              :key="cabinet.id"
              :disabled="cabinet.cabinetStatus === 'DISABLED'"
              :label="cabinet.cabinetCode"
              :value="cabinet.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="archiveForm.remarks" style="width: 240px" />
        </ElFormItem>
        <ElFormItem v-if="objectType === 'SPECIMEN'" label="过期时间">
          <ElDatePicker
            v-model="archiveForm.archiveExpiresAt"
            format="YYYY/MM/DD HH:mm:ss"
            placeholder="请选择过期时间"
            style="width: 220px"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem v-if="objectType === 'SPECIMEN'" label="剩余几天提醒">
          <ElInputNumber
            v-model="archiveForm.archiveReminderDays"
            :min="0"
            :precision="0"
            style="width: 240px"
          />
        </ElFormItem>
      </div>
    </ElForm>

    <ElTable border :data="selectedRecords" max-height="320" row-key="objectId">
      <ElTableColumn label="病理号" min-width="110" prop="pathologyNo" />
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX' || objectType === 'SLIDE'"
        label="子号"
        min-width="80"
      >
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'SPECIMEN'"
        label="标本编号"
        min-width="110"
      >
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="当前状态"
        min-width="100"
      >
        <template #default="{ row }">
          {{ formatArchiveObjectStatus(row.objectStatus) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档状态" min-width="100">
        <template #default="{ row }">
          <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
            {{ formatArchiveStorageStatus(row.archiveStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="取材人"
        min-width="120"
      >
        <template #default="{ row }">
          {{ formatNullable(row.sampledByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'SLIDE'"
        label="切片人"
        min-width="150"
      >
        <template #default="{ row }">
          {{ formatNullable(row.slicedByName) }}
          <div
            v-if="row.slicedAt"
            class="text-xs text-[var(--el-text-color-secondary)]"
          >
            {{ row.slicedAt }}
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'SPECIMEN'"
        label="内容描述人"
        min-width="120"
      >
        <template #default="{ row }">
          {{ formatNullable(row.contentDescribedByName) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <ElButton @click="visible = false">退出</ElButton>
      <ElButton
        :disabled="
          selectedRecords.length === 0 || Boolean(archivePermissionWarning)
        "
        :loading="submitting"
        type="primary"
        @click="emit('submitArchive')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
