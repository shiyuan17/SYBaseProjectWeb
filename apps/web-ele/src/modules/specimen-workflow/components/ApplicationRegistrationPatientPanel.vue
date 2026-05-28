<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { computed, nextTick, ref } from 'vue';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  buildingLabel: string;
  record: ApplicationRegistrationWorkbenchRecord | null;
  roomLabel: string;
}>();

const emit = defineEmits<{
  (event: 'reprint-application-form', applicationId: string): void;
  (event: 'update:record', value: ApplicationRegistrationWorkbenchRecord): void;
}>();

type WorkbenchEditorType = 'readonly' | 'select' | 'text' | 'textarea';

type WorkbenchInfoItem = {
  editorType: WorkbenchEditorType;
  key: string;
  label: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  rows?: number;
  value: string;
  writeBack?: (
    record: ApplicationRegistrationWorkbenchRecord,
    value: string,
  ) => ApplicationRegistrationWorkbenchRecord;
};

type WorkbenchSection = {
  items: WorkbenchInfoItem[];
  key: string;
  title: string;
};

type WorkbenchSummaryItem = {
  emphasized?: boolean;
  label: string;
  span?: number;
  value: string;
};

const activeEditorKey = ref('');
const editingValue = ref('');

const summaryItems = computed(() =>
  props.record ? buildSummaryItems(props.record) : [],
);

const patientTags = computed(() =>
  props.record ? buildPatientTags(props.record) : [],
);

const contagiousTags = computed(() =>
  props.record ? buildContagiousTags(props.record) : [],
);

const gynecologyTags = computed(() =>
  props.record ? buildGynecologyTags(props.record) : [],
);

const sections = computed(() =>
  props.record ? buildSections(props.record) : [],
);

function formatValue(value: null | string | undefined) {
  return value && value.trim() ? value : '-';
}

function normalizeTextValue(value: string) {
  return value.trim();
}

function buildSummaryItems(record: ApplicationRegistrationWorkbenchRecord): WorkbenchSummaryItem[] {
  const wardLabel = formatValue(record.patientInfo.wardName);
  const bedLabel = formatValue(record.patientInfo.bedNo);

  return [
    {
      emphasized: true,
      label: '申请单号',
      value: formatValue(record.patientInfo.applicationNo),
    },
    { label: '住院号', value: formatValue(record.patientInfo.inpatientNo) },
    {
      emphasized: true,
      label: '患者',
      value: formatValue(record.patientInfo.patientName),
    },
    {
      label: '性别/年龄',
      value: `${record.patientInfo.gender || '-'} / ${record.patientInfo.age || '-'}`,
    },
    {
      label: '病区/床号',
      value:
        wardLabel === '-' && bedLabel === '-'
          ? '-'
          : `${wardLabel}${bedLabel === '-' ? '' : ` / ${bedLabel}`}`,
    },
    { label: '联系电话', value: formatValue(record.patientInfo.phone) },
    {
      label: '申请科室/医生',
      span: 2,
      value: `${formatValue(record.patientInfo.applyDept)} / ${formatValue(record.patientInfo.applyDoctor)}`,
    },
  ];
}

function buildPatientTags(record: ApplicationRegistrationWorkbenchRecord) {
  const tags = [
    record.patientInfo.specimenType
      ? { label: record.patientInfo.specimenType, type: 'primary' as const }
      : null,
    record.patientInfo.deliveryRequirement
      ? {
          label: record.patientInfo.deliveryRequirement,
          type: 'success' as const,
        }
      : null,
    record.patientInfo.patientVerified
      ? { label: '患者已核对', type: 'warning' as const }
      : null,
    record.patientInfo.frozenReminder
      ? { label: '冰冻提醒', type: 'danger' as const }
      : null,
  ];

  return tags.filter(
    (
      tag,
    ): tag is {
      label: string;
      type: 'danger' | 'primary' | 'success' | 'warning';
    } => Boolean(tag),
  );
}

function buildContagiousTags(record: ApplicationRegistrationWorkbenchRecord) {
  const tags = [
    { active: record.contagiousSpecimen.isolation, label: '隔离' },
    { active: record.contagiousSpecimen.hiv, label: 'HIV' },
    { active: record.contagiousSpecimen.tuberculosis, label: '结核' },
    { active: record.contagiousSpecimen.hepatitis, label: '肝炎' },
    { active: record.contagiousSpecimen.syphilis, label: '梅毒' },
  ];

  return tags.filter((tag) => tag.active);
}

function buildGynecologyTags(record: ApplicationRegistrationWorkbenchRecord) {
  const conditions = record.gynecologyInfo.specialConditions;
  const tags = [
    { active: conditions.menopause, label: '绝经' },
    { active: conditions.hormoneReplacement, label: 'HRT' },
    { active: conditions.birthControl, label: '避孕药/针' },
    { active: conditions.iud, label: '宫内节育器' },
    { active: conditions.pregnancy, label: '妊娠' },
    { active: conditions.lactation, label: '哺乳期' },
    { active: conditions.abnormalBleeding, label: '异常流血' },
    { active: conditions.radiotherapy, label: '放射治疗' },
    { active: conditions.hysterectomy, label: '子宫全切术后' },
  ];

  return tags.filter((tag) => tag.active);
}

function buildSections(record: ApplicationRegistrationWorkbenchRecord): WorkbenchSection[] {
  return [
    {
      key: 'clinical',
      title: '临床信息',
      items: [
        {
          editorType: 'text',
          key: 'checkItem',
          label: '检查项目',
          value: formatValue(record.patientInfo.checkItem),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              checkItem: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'clinicalHistory',
          label: '临床病史',
          rows: 3,
          value: formatValue(record.patientInfo.clinicalHistory),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              clinicalHistory: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'imagingResult',
          label: '影像结果',
          rows: 3,
          value: formatValue(record.patientInfo.imagingResult),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              imagingResult: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'text',
          key: 'clinicalDiagnosis',
          label: '临床诊断',
          value: formatValue(record.patientInfo.clinicalDiagnosis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              clinicalDiagnosis: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'endoscopyDiagnosis',
          label: '内镜诊断',
          rows: 3,
          value: formatValue(record.patientInfo.endoscopyDiagnosis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              endoscopyDiagnosis: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'remark',
          label: '备注',
          rows: 3,
          value: formatValue(record.patientInfo.remark),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              remark: normalizeTextValue(value),
            },
          }),
        },
      ],
    },
    {
      key: 'surgery',
      title: '手术信息',
      items: [
        {
          editorType: 'text',
          key: 'surgeryName',
          label: '手术名称',
          value: formatValue(record.surgeryInfo.surgeryName),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              surgeryName: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'readonly',
          key: 'buildingRoom',
          label: '手术楼/手术室',
          value: `${formatValue(props.buildingLabel)} / ${formatValue(props.roomLabel)}`,
        },
        {
          editorType: 'textarea',
          key: 'clinicalFindings',
          label: '术中所见',
          rows: 3,
          value: formatValue(record.surgeryInfo.clinicalFindings),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              clinicalFindings: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'readonly',
          key: 'fixationInfo',
          label: '固定时间/人',
          value: `${formatValue(record.surgeryInfo.fixationTime)} / ${formatValue(
            record.surgeryInfo.fixationPerson,
          )}`,
        },
        {
          editorType: 'text',
          key: 'fixativeType',
          label: '固定液',
          value: formatValue(record.surgeryInfo.fixativeType),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              fixativeType: normalizeTextValue(value),
            },
          }),
        },
      ],
    },
    {
      key: 'gynecology',
      title: '妇科信息',
      items: [
        {
          editorType: 'select',
          key: 'menopause',
          label: '是否绝经',
          options: [
            { label: '是', value: 'true' },
            { label: '否', value: 'false' },
          ],
          value: record.gynecologyInfo.menopause ? '是' : '否',
          writeBack: (currentRecord, value) => {
            const normalizedValue = value === 'true';
            return {
              ...currentRecord,
              gynecologyInfo: {
                ...currentRecord.gynecologyInfo,
                menopause: normalizedValue,
                specialConditions: {
                  ...currentRecord.gynecologyInfo.specialConditions,
                  menopause: normalizedValue,
                },
              },
            };
          },
        },
        {
          editorType: 'text',
          key: 'lastMenstrualPeriod',
          label: '最后月经',
          value: formatValue(record.gynecologyInfo.lastMenstrualPeriod),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              lastMenstrualPeriod: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'text',
          key: 'hpvResult',
          label: 'HPV',
          value: formatValue(record.gynecologyInfo.hpvResult),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              hpvResult: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'previousCytology',
          label: '既往宫颈脱落细胞',
          rows: 3,
          value: formatValue(record.gynecologyInfo.previousCytology),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              previousCytology: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'previousTreatment',
          label: '既往治疗',
          rows: 3,
          value: formatValue(record.gynecologyInfo.previousTreatment),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              previousTreatment: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'additionalNotes',
          label: '其他说明',
          rows: 3,
          value: formatValue(
            record.gynecologyInfo.specialConditions.other ||
              record.gynecologyInfo.additionalNotes,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              additionalNotes: normalizeTextValue(value),
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                other: normalizeTextValue(value),
              },
            },
          }),
        },
      ],
    },
  ];
}

function getSectionDescriptionColumns(sectionKey: string) {
  return sectionKey === 'clinical' ? 2 : 2;
}

function getSectionItemSpan(sectionKey: string, item: WorkbenchInfoItem) {
  if (item.editorType === 'textarea') {
    return 2;
  }

  if (item.key === 'buildingRoom' || item.key === 'fixationInfo') {
    return 2;
  }

  return 1;
}

function cancelEditing() {
  activeEditorKey.value = '';
  editingValue.value = '';
}

async function beginEditing(item: WorkbenchInfoItem) {
  if (!props.record || item.editorType === 'readonly') {
    return;
  }

  activeEditorKey.value = item.key;
  editingValue.value =
    item.editorType === 'select'
      ? item.value === '是'
        ? 'true'
        : 'false'
      : item.value === '-'
        ? ''
        : item.value;

  await nextTick();
  const editor = document.querySelector<HTMLElement>(
    `[data-editor-key="${item.key}"] input, [data-editor-key="${item.key}"] textarea`,
  );
  editor?.focus();
}

function saveEditing(item: WorkbenchInfoItem) {
  if (!props.record || !item.writeBack) {
    cancelEditing();
    return;
  }

  const updatedRecord = item.writeBack(props.record, editingValue.value);
  emit('update:record', updatedRecord);
  cancelEditing();
}

function handleValueDoubleClick(item: WorkbenchInfoItem) {
  if (item.editorType === 'readonly') {
    return;
  }
  void beginEditing(item);
}

function emitReprintApplicationForm() {
  const applicationId = props.record?.applicationId?.trim() ?? '';
  if (!applicationId) {
    return;
  }
  emit('reprint-application-form', applicationId);
}
</script>

<template>
  <WorkflowSectionCard title="患者信息">
    <template v-if="props.record" #extra>
      <ElButton size="small" @click="emitReprintApplicationForm">补打申请单</ElButton>
    </template>

    <template v-if="props.record">
      <div class="flex h-full min-h-0 flex-col gap-2 overflow-y-auto pr-1">
        <div class="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <ElDescriptions
            :column="3"
            border
            size="small"
            class="patient-summary-descriptions"
          >
            <ElDescriptionsItem
              v-for="item in summaryItems"
              :key="item.label"
              :label="item.label"
              :span="item.span ?? 1"
            >
              <span
                class="break-words text-[11px] font-medium leading-4 text-foreground"
                :class="
                  item.label === '申请单号'
                    ? 'text-[12px] font-semibold'
                    : item.emphasized
                      ? 'text-[13px] font-semibold'
                      : ''
                "
              >
                {{ item.value }}
              </span>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <div
          v-if="patientTags.length || contagiousTags.length"
          class="flex flex-wrap gap-1 rounded-lg border border-border/70 bg-muted/10 px-1.5 py-0.5"
        >
          <ElTag
            v-for="tag in patientTags"
            :key="tag.label"
            :type="tag.type"
            effect="plain"
            size="small"
          >
            {{ tag.label }}
          </ElTag>
          <ElTag
            v-for="tag in contagiousTags"
            :key="tag.label"
            effect="plain"
            size="small"
            type="danger"
          >
            {{ tag.label }}
          </ElTag>
        </div>

        <div class="flex min-h-0 flex-col gap-1">
          <section
            v-for="section in sections"
            :key="section.key"
            class="px-0"
          >
            <ElDivider class="patient-section-divider" content-position="center">
              <span class="patient-section-divider__text">{{ section.title }}</span>
            </ElDivider>

            <ElDescriptions
              :column="getSectionDescriptionColumns(section.key)"
              border
              size="small"
              class="patient-section-descriptions"
            >
              <ElDescriptionsItem
                v-for="item in section.items"
                :key="item.key"
                :data-testid="`patient-item-${item.key}`"
                :label="item.label"
                :span="getSectionItemSpan(section.key, item)"
              >
                <div class="group/item relative min-h-4">
                  <button
                    v-if="item.editorType !== 'readonly' && activeEditorKey !== item.key"
                    :data-testid="`patient-edit-${item.key}`"
                    class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border/70 bg-background/95 text-[10px] text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-primary/50 hover:text-primary group-hover/item:opacity-100"
                    type="button"
                    @click.stop="beginEditing(item)"
                  >
                    <span class="leading-none">编</span>
                  </button>

                  <template v-if="activeEditorKey === item.key">
                    <div :data-editor-key="item.key" class="flex items-start gap-1.5">
                      <div class="min-w-0 flex-1">
                        <ElInput
                          v-if="item.editorType === 'text'"
                          v-model="editingValue"
                          clearable
                          :data-testid="`patient-input-${item.key}`"
                          size="small"
                          @keyup.enter="saveEditing(item)"
                          @keyup.esc="cancelEditing"
                        />

                        <ElInput
                          v-else-if="item.editorType === 'textarea'"
                          v-model="editingValue"
                          clearable
                          :autosize="{ minRows: item.rows ?? 2, maxRows: item.rows ?? 4 }"
                          :data-testid="`patient-input-${item.key}`"
                          resize="none"
                          size="small"
                          type="textarea"
                          @keydown.ctrl.enter.prevent="saveEditing(item)"
                          @keyup.esc="cancelEditing"
                        />

                        <ElSelect
                          v-else
                          v-model="editingValue"
                          :data-testid="`patient-input-${item.key}`"
                          size="small"
                        >
                          <ElOption
                            v-for="option in item.options"
                            :key="`${item.key}-${String(option.value)}`"
                            :label="option.label"
                            :value="option.value"
                          />
                        </ElSelect>
                      </div>

                      <div class="flex shrink-0 flex-col gap-1">
                        <ElButton
                          :data-testid="`patient-save-${item.key}`"
                          circle
                          plain
                          size="small"
                          type="primary"
                          @click="saveEditing(item)"
                        >
                          <span class="text-[12px] leading-none">存</span>
                        </ElButton>
                        <ElButton
                          :data-testid="`patient-cancel-${item.key}`"
                          circle
                          plain
                          size="small"
                          @click="cancelEditing"
                        >
                          <span class="text-[12px] leading-none">取消</span>
                        </ElButton>
                      </div>
                    </div>
                  </template>

                  <div
                    v-else
                    :data-testid="`patient-value-${item.key}`"
                    class="break-words pr-5 text-[11px] font-medium leading-4 text-foreground"
                    :class="item.editorType === 'readonly' ? 'pr-0' : 'cursor-text'"
                    @dblclick="handleValueDoubleClick(item)"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </ElDescriptionsItem>
            </ElDescriptions>

            <div
              v-if="section.key === 'gynecology' && gynecologyTags.length > 0"
              class="px-1.5 py-0.5"
            >
              <div class="flex flex-wrap gap-1">
                <ElTag
                  v-for="tag in gynecologyTags"
                  :key="tag.label"
                  effect="plain"
                  size="small"
                  type="warning"
                >
                  {{ tag.label }}
                </ElTag>
              </div>
            </div>
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
  white-space: nowrap;
  font-size: 10px;
}

:deep(.patient-summary-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.2;
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
  border-radius: 999px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

:deep(.patient-section-descriptions .el-descriptions__label),
:deep(.patient-section-descriptions .el-descriptions__content) {
  padding: 3px 6px;
  vertical-align: top;
}

:deep(.patient-section-descriptions .el-descriptions__label) {
  width: 70px;
  white-space: nowrap;
  font-size: 10px;
}

:deep(.patient-section-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.25;
}
</style>
