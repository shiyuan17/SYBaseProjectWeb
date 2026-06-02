<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { WorkbenchInfoItem } from '../utils/application-registration-patient-panel';

import { computed, toRef } from 'vue';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElEmpty,
} from 'element-plus';

import { useApplicationRegistrationPatientPanel } from '../composables/useApplicationRegistrationPatientPanel';
import {
  getSectionDescriptionColumns,
  getSectionItemSpan,
  getSummaryItemValueClass,
} from '../utils/application-registration-patient-panel';
import ApplicationRegistrationDirectEditableField from './ApplicationRegistrationDirectEditableField.vue';
import ApplicationRegistrationEditableField from './ApplicationRegistrationEditableField.vue';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = withDefaults(
  defineProps<{
    buildingLabel: string;
    compact?: boolean;
    editMode?: 'direct' | 'triggered';
    fullHeight?: boolean;
    record: ApplicationRegistrationWorkbenchRecord | null;
    roomLabel: string;
    saveDisabled?: boolean;
    saving?: boolean;
    showReprintAction?: boolean;
    showSaveAction?: boolean;
    title?: string;
  }>(),
  {
    compact: false,
    editMode: 'triggered',
    fullHeight: false,
    saveDisabled: true,
    saving: false,
    showReprintAction: true,
    showSaveAction: true,
    title: '患者信息',
  },
);

const emit = defineEmits<{
  (event: 'save-patient-info'): void;
  (event: 'update:record', value: ApplicationRegistrationWorkbenchRecord): void;
}>();

const {
  activeEditorKey,
  beginEditing,
  cancelEditing,
  editingValue,
  handleValueDoubleClick,
  printApplicationForm,
  savePatientInfo,
  saveEditing,
  sections,
  summaryItems,
} = useApplicationRegistrationPatientPanel({
  buildingLabel: toRef(props, 'buildingLabel'),
  record: toRef(props, 'record'),
  roomLabel: toRef(props, 'roomLabel'),
  savePatientInfo: () => emit('save-patient-info'),
  updateRecord: (record) => emit('update:record', record),
});

const hasRecord = computed(() => props.record !== null);
const isDirectEditMode = computed(() => props.editMode === 'direct');

function handleDirectFieldUpdate(item: WorkbenchInfoItem, value: string) {
  if (!props.record || !item.writeBack) {
    return;
  }
  emit('update:record', item.writeBack(props.record, value));
}
</script>

<template>
  <WorkflowSectionCard
    :class="
      [
        props.compact ? 'patient-panel--compact' : '',
        props.fullHeight
          ? props.compact
            ? 'min-h-0 max-h-full overflow-hidden'
            : 'min-h-[420px] max-h-full overflow-hidden'
          : 'max-h-full overflow-hidden',
      ]
    "
    :auto-height="!props.fullHeight"
    :title="props.title"
  >
    <template v-if="hasRecord" #extra>
      <div class="flex items-center gap-2">
        <ElButton
          v-if="props.showReprintAction"
          size="small"
          @click="printApplicationForm"
        >
          补打申请单
        </ElButton>
        <ElButton
          v-if="props.showSaveAction"
          :disabled="props.saveDisabled"
          :loading="props.saving"
          size="small"
          type="primary"
          @click="savePatientInfo"
        >
          保存
        </ElButton>
      </div>
    </template>

    <template v-if="hasRecord">
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pr-1">
        <div
          class="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm"
        >
          <ElDescriptions
            :column="3"
            border
            size="small"
            class="patient-summary-descriptions"
          >
            <ElDescriptionsItem
              v-for="item in summaryItems"
              :key="item.key"
              :label="item.label"
              :span="item.span ?? 1"
            >
              <ApplicationRegistrationDirectEditableField
                v-if="isDirectEditMode"
                :item="item"
                :value-class="getSummaryItemValueClass(item)"
                @update="handleDirectFieldUpdate"
              />
              <ApplicationRegistrationEditableField
                v-else
                v-model:editing-value="editingValue"
                :is-editing="activeEditorKey === item.key"
                :item="item"
                :value-class="getSummaryItemValueClass(item)"
                @activate="handleValueDoubleClick"
                @begin-edit="beginEditing"
                @cancel="cancelEditing"
                @save="saveEditing"
              />
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          <section v-for="section in sections" :key="section.key" class="px-0">
            <ElDivider
              class="patient-section-divider"
              content-position="center"
            >
              <span class="patient-section-divider__text">{{
                section.title
              }}</span>
            </ElDivider>

            <ElDescriptions
              :column="getSectionDescriptionColumns()"
              border
              size="small"
              class="patient-section-descriptions"
            >
              <ElDescriptionsItem
                v-for="item in section.items"
                :key="item.key"
                :data-testid="`patient-item-${item.key}`"
                :label="item.label"
                :span="getSectionItemSpan(item)"
              >
                <ApplicationRegistrationDirectEditableField
                  v-if="isDirectEditMode"
                  :item="item"
                  @update="handleDirectFieldUpdate"
                />
                <ApplicationRegistrationEditableField
                  v-else
                  v-model:editing-value="editingValue"
                  :is-editing="activeEditorKey === item.key"
                  :item="item"
                  @activate="handleValueDoubleClick"
                  @begin-edit="beginEditing"
                  @cancel="cancelEditing"
                  @save="saveEditing"
                />
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>
        </div>
      </div>
    </template>

    <ElEmpty v-else description="请先查询住院号或申请单号" />
  </WorkflowSectionCard>
</template>

<style scoped>
:deep(.patient-summary-descriptions .el-descriptions__label),
:deep(.patient-summary-descriptions .el-descriptions__content) {
  padding: 3px 6px;
}

:deep(.patient-summary-descriptions .el-descriptions__label) {
  width: 68px;
  font-size: 10px;
  white-space: nowrap;
}

:deep(.patient-summary-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.2;
  vertical-align: top;
}

:deep(.patient-section-divider) {
  margin: 1px 0 4px;
}

:deep(.patient-section-divider .el-divider__text) {
  padding: 0 6px;
  background-color: transparent;
}

.patient-section-divider__text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

:deep(.patient-section-descriptions .el-descriptions__label),
:deep(.patient-section-descriptions .el-descriptions__content) {
  padding: 3px 6px;
  vertical-align: top;
}

:deep(.patient-section-descriptions .el-descriptions__label) {
  width: 88px;
  font-size: 10px;
  white-space: nowrap;
}

:deep(.patient-section-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.25;
}
</style>
